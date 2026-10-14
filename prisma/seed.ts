// Base data, safe to run on every deploy (idempotent): the branches, the menu (only into an
// empty database), the Google reviews and the first admin. Nothing here overwrites what staff
// later edit in the back-office.
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import reviewsFile from './data/google-reviews.json' with { type: 'json' };
import { MENU, MENU_B_BRANCHES } from './data/menu';

const db = new PrismaClient();

const place = (id: string) => `https://www.google.com/maps/place/?q=place_id:${id}`;
const directions = (lat: number, lng: number) => `https://www.google.com/maps?q=${lat},${lng}&z=17&hl=fr`;

// Locations and phone numbers provided by Bonici (October 2026).
const RESTAURANTS = [
  { slug: 'ramatou', name: 'Bonici Ramatou', address: 'Rond-point Ramatou, Kanyikopé', city: 'Lomé', phone: '92 65 65 65', lat: 6.1551752, lng: 1.2962631, review: place('ChIJq4NPkEDlIxARJ40DP1U1wUc'), googleBranch: 'Kanyikopé' },
  { slug: '2-lions', name: 'Bonici 2 Lions', address: 'Carrefour 2 Lions, Agoè', city: 'Lomé', phone: '92 32 32 32', lat: 6.2165247, lng: 1.1886087, review: place('ChIJzwcTNwBZIRARt_-RNrHJ1AA'), googleBranch: 'Agoè 2 Lions' },
  { slug: 'adjololo', name: 'Bonici Adjololo', address: 'Adjololo, Nyékonakpoè', city: 'Lomé', phone: '93 45 45 45', lat: 6.1260619, lng: 1.2025979, review: '', googleBranch: null },
  // TODO(Bonici): exact location to come; "Adewi" is the address the old site had for Tam Tam.
  { slug: 'tam-tam', name: 'Bonici Tam Tam', address: 'Adewi', city: 'Lomé', phone: '92 64 99 99', lat: null, lng: null, review: '', googleBranch: null },
  { slug: 'aneho', name: 'Bonici Aného', address: 'Kpota', city: 'Aného', phone: '92 51 51 51', lat: 6.2271678, lng: 1.587809, review: place('ChIJVfwNQkiTIxARdhEiqeK0tMw'), googleBranch: 'Aného' },
  { slug: 'kpalime', name: 'Bonici Kpalimé', address: 'Kpalimé', city: 'Kpalimé', phone: '92 13 91 91', lat: 6.8940871, lng: 0.6386458, review: '', googleBranch: null },
  { slug: 'kara', name: 'Bonici Kara', address: 'Kara', city: 'Kara', phone: '93 71 71 71', lat: 9.559632, lng: 1.1926227, review: '', googleBranch: null },
];

/** "il y a 2 ans" -> approximate Date before `from`. */
function fromRelative(label: string, from: Date): Date {
  const m = label.match(/il y a (un|une|\d+) (jour|semaine|mois|an)/);
  const d = new Date(from);
  if (!m) return d;
  const n = m[1] === 'un' || m[1] === 'une' ? 1 : Number(m[1]);
  if (m[2] === 'jour') d.setDate(d.getDate() - n);
  if (m[2] === 'semaine') d.setDate(d.getDate() - 7 * n);
  if (m[2] === 'mois') d.setMonth(d.getMonth() - n);
  if (m[2] === 'an') d.setFullYear(d.getFullYear() - n);
  return d;
}

async function seedRestaurants() {
  for (const [position, r] of RESTAURANTS.entries()) {
    await db.restaurant.upsert({
      where: { slug: r.slug },
      update: {},
      create: {
        slug: r.slug, name: r.name, address: r.address, city: r.city, phone: r.phone, position,
        latitude: r.lat, longitude: r.lng,
        googleMapsUrl: r.lat !== null && r.lng !== null ? directions(r.lat, r.lng) : '',
        googleReviewUrl: r.review,
        openingHours: "Jusqu'à 23h",
      },
    });
  }
}

/** Loads the menu into an empty database only, so admin edits are never overwritten. */
async function seedMenu() {
  if (await db.dish.count()) return 'menu already present, skipped';
  const restaurants = await db.restaurant.findMany({ select: { id: true, slug: true } });
  let dishes = 0;
  for (const [position, section] of MENU.entries()) {
    const category = await db.category.upsert({
      where: { slug: section.slug },
      update: {},
      create: { slug: section.slug, name: section.name, position },
    });
    for (const item of section.items) {
      const variants = (item.variants ?? []).map(([label, price], i) => ({ label, price, position: i }));
      const branches = item.onlyMenuB ? restaurants.filter((r) => MENU_B_BRANCHES.includes(r.slug)) : restaurants;
      await db.dish.create({
        data: {
          name: item.name,
          description: item.description ?? '',
          basePrice: item.price ?? Math.min(...variants.map((v) => v.price)),
          categoryId: category.id,
          image: `/images/menu/${item.image}.jpg`,
          isFeatured: item.featured ?? false,
          variants: { create: variants },
          menuItems: { create: branches.map((r) => ({ restaurantId: r.id })) },
        },
      });
      dishes++;
    }
  }
  return `${dishes} dishes in ${MENU.length} categories`;
}

async function seedReviews() {
  const capturedOn = new Date(reviewsFile.capturedOn);
  let count = 0;
  for (const branch of reviewsFile.branches) {
    const slug = RESTAURANTS.find((r) => r.googleBranch === branch.branch)?.slug;
    const restaurant = slug ? await db.restaurant.findUnique({ where: { slug } }) : null;
    for (const r of branch.reviews) {
      const restaurantId = restaurant?.id ?? null;
      if (await db.review.findFirst({ where: { source: 'GOOGLE', restaurantId, author: r.author } })) continue;
      await db.review.create({
        data: { source: 'GOOGLE', restaurantId, author: r.author, rating: r.stars, text: r.text, publishedAt: fromRelative(r.date, capturedOn) },
      });
      count++;
    }
  }
  return count;
}

async function seedAdmin() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (await db.user.count({ where: { role: 'ADMIN' } })) return;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 8) {
    console.warn('No admin account: set ADMIN_EMAIL and ADMIN_PASSWORD (8+ characters) and run the seed again.');
    return;
  }
  await db.user.create({
    data: { email: ADMIN_EMAIL.toLowerCase(), name: 'Administrateur', role: 'ADMIN', passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12) },
  });
  console.log(`Admin account created: ${ADMIN_EMAIL}`);
}

async function main() {
  await seedRestaurants();
  const menu = await seedMenu();
  const reviews = await seedReviews();
  await seedAdmin();
  console.log(`Seed done: ${RESTAURANTS.length} branches, ${menu}, ${reviews} new reviews.`);
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => db.$disconnect());
