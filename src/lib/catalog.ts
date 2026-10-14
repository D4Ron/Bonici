import 'server-only';
import { db } from './db';
import { bestDiscount, discountedPrice, type PricingMenuEntry, type PricingPromotion, type PricingRestaurant } from './pricing';
import { publicUrl } from './uploads';

/** Promotions running right now for a restaurant (including the all-restaurant ones). */
export async function activePromotions(restaurantId: number, now = new Date()): Promise<PricingPromotion[]> {
  const promos = await db.promotion.findMany({
    where: {
      isActive: true,
      startsAt: { lte: now },
      endsAt: { gte: now },
      OR: [{ restaurantId }, { restaurantId: null }],
    },
    select: { discountPercent: true, dishes: { select: { id: true } } },
  });
  return promos.map((p) => ({ discountPercent: p.discountPercent, dishIds: p.dishes.map((d) => d.id) }));
}

type VariantRow = { id: number; label: string; price: number };
const byPosition = { orderBy: [{ position: 'asc' as const }, { id: 'asc' as const }] };

/** Price options of a dish on a branch's menu: its variants, or the single (branch) price. */
function priceOptions(dish: { basePrice: number; variants: VariantRow[] }, branchPrice: number | null): { variantId: number | null; label: string; price: number }[] {
  if (dish.variants.length) return dish.variants.map((v) => ({ variantId: v.id, label: v.label, price: v.price }));
  return [{ variantId: null, label: '', price: branchPrice ?? dish.basePrice }];
}

const withLabel = (name: string, label: string) => (label ? `${name} (${label})` : name);

/** Everything the pricing rules need for one restaurant, straight from the database. */
export async function pricingContext(restaurantId: number): Promise<{
  restaurant: PricingRestaurant & { id: number; name: string; isActive: boolean };
  menu: PricingMenuEntry[];
  promotions: PricingPromotion[];
} | null> {
  const restaurant = await db.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant || !restaurant.isActive) return null;
  const items = await db.menuItem.findMany({
    where: { restaurantId, dish: { isActive: true } },
    include: { dish: { select: { name: true, basePrice: true, variants: byPosition } } },
  });
  return {
    restaurant,
    menu: items.flatMap((mi) => priceOptions(mi.dish, mi.price).map((o) => ({
      dishId: mi.dishId,
      variantId: o.variantId,
      name: withLabel(mi.dish.name, o.label),
      price: o.price,
      isAvailable: mi.isAvailable,
    }))),
    promotions: await activePromotions(restaurantId),
  };
}

export const listRestaurants = () =>
  db.restaurant.findMany({ where: { isActive: true }, orderBy: [{ position: 'asc' }, { name: 'asc' }] });

export const listCategories = () =>
  db.category.findMany({ where: { isActive: true }, orderBy: [{ position: 'asc' }, { name: 'asc' }] });

export interface MenuVariant {
  id: number | null; // null for a dish sold at a single price
  label: string;
  price: number; // what the customer pays
  originalPrice: number;
}

export interface MenuDish {
  id: number;
  name: string;
  description: string;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  image: string;
  variants: MenuVariant[]; // always at least one
  price: number; // cheapest option, after promotion
  originalPrice: number;
  discount: number;
  isAvailable: boolean;
  isDailySpecial: boolean;
}

const FALLBACK_IMAGE = '/images/logo-bonici.png';

/** One restaurant's menu with today's promotional prices applied. */
export async function restaurantMenu(restaurantId: number): Promise<MenuDish[]> {
  const [items, promotions] = await Promise.all([
    db.menuItem.findMany({
      where: { restaurantId, dish: { isActive: true, category: { isActive: true } } },
      include: { dish: { include: { category: true, variants: byPosition } } },
      orderBy: [{ dish: { category: { position: 'asc' } } }, { dish: { createdAt: 'asc' } }],
    }),
    activePromotions(restaurantId),
  ]);
  return items.map((mi) => {
    const discount = bestDiscount(mi.dishId, promotions);
    const variants = priceOptions(mi.dish, mi.price).map((o) => ({
      id: o.variantId,
      label: o.label,
      price: discountedPrice(o.price, discount),
      originalPrice: o.price,
    }));
    const cheapest = variants.reduce((a, b) => (b.price < a.price ? b : a));
    return {
      id: mi.dishId,
      name: mi.dish.name,
      description: mi.dish.description,
      categoryId: mi.dish.categoryId,
      categoryName: mi.dish.category.name,
      categorySlug: mi.dish.category.slug,
      image: publicUrl(mi.dish.image) ?? FALLBACK_IMAGE,
      variants,
      price: cheapest.price,
      originalPrice: cheapest.originalPrice,
      discount,
      isAvailable: mi.isAvailable,
      isDailySpecial: mi.isDailySpecial,
    };
  });
}

/** Lowest price a dish is sold at anywhere ("dès 3 500 FCFA"). */
const fromPrice = (d: { basePrice: number; variants: VariantRow[]; menuItems: { price: number | null }[] }) =>
  d.variants.length ? Math.min(...d.variants.map((v) => v.price)) : Math.min(...d.menuItems.map((m) => m.price ?? d.basePrice));

/** Dishes for the home page, grouped by category. */
export async function homeDishesByCategory(perCategory = 4) {
  const categories = await db.category.findMany({
    where: { isActive: true },
    orderBy: [{ position: 'asc' }, { name: 'asc' }],
    include: {
      dishes: {
        where: { isActive: true, menuItems: { some: { restaurant: { isActive: true } } } },
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'asc' }],
        take: perCategory,
        include: { menuItems: { select: { price: true } }, variants: byPosition },
      },
    },
  });
  return categories
    .filter((c) => c.dishes.length > 0)
    .map((c) => ({
      slug: c.slug,
      name: c.name,
      dishes: c.dishes.map((d) => ({ id: d.id, name: d.name, image: publicUrl(d.image) ?? FALLBACK_IMAGE, price: fromPrice(d) })),
    }));
}

/** Most ordered dishes over the last 90 days, topped up with dishes marked "featured". */
export async function popularDishes(limit = 8) {
  const since = new Date(Date.now() - 90 * 86_400_000);
  const ranked = await db.orderItem.groupBy({
    by: ['dishId'],
    where: { dishId: { not: null }, order: { createdAt: { gte: since }, status: { notIn: ['CANCELLED', 'REJECTED'] } } },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: limit,
  });
  const rankedIds = ranked.map((r) => r.dishId!) as number[];
  const dishes = await db.dish.findMany({
    where: {
      isActive: true,
      menuItems: { some: { restaurant: { isActive: true } } },
      OR: [{ id: { in: rankedIds } }, { isFeatured: true }],
    },
    include: { category: true, menuItems: { select: { price: true } }, variants: byPosition },
  });
  dishes.sort((a, b) => {
    const ra = rankedIds.indexOf(a.id), rb = rankedIds.indexOf(b.id);
    return (ra === -1 ? Infinity : ra) - (rb === -1 ? Infinity : rb);
  });
  return dishes.slice(0, limit).map((d) => ({
    id: d.id,
    name: d.name,
    category: d.category.name,
    image: publicUrl(d.image) ?? FALLBACK_IMAGE,
    price: fromPrice(d),
  }));
}

/** Promotions shown on the home page. */
export async function currentPromotions(now = new Date()) {
  const promos = await db.promotion.findMany({
    where: { isActive: true, startsAt: { lte: now }, endsAt: { gte: now } },
    include: { restaurant: true, dishes: { include: { menuItems: true, variants: byPosition } } },
    orderBy: { endsAt: 'asc' },
    take: 6,
  });
  return promos
    .filter((p) => p.dishes.length > 0 && (!p.restaurant || p.restaurant.isActive))
    .map((p) => {
      const first = p.dishes[0];
      const branchPrice = p.restaurantId ? first.menuItems.find((m) => m.restaurantId === p.restaurantId)?.price ?? null : null;
      const price = priceOptions(first, branchPrice)[0].price;
      return {
        id: p.id,
        title: p.title,
        discountPercent: p.discountPercent,
        dishNames: p.dishes.map((d) => d.name),
        restaurantName: p.restaurant?.name ?? 'Tous nos restaurants',
        restaurantSlug: p.restaurant?.slug ?? null,
        price,
        newPrice: discountedPrice(price, p.discountPercent),
        endsAt: p.endsAt,
      };
    });
}

// Reviews: only 4★+ with a written comment are shown on the site (the rest stay on Google).
export const SHOWN_REVIEW = { isPublished: true, rating: { gte: 4 }, NOT: { text: '' } } as const;

export const featuredReviews = (take = 6) =>
  db.review.findMany({ where: SHOWN_REVIEW, include: { restaurant: true }, orderBy: { publishedAt: 'desc' }, take });

/** Overall Google rating across every review (including the ones not displayed). */
export async function googleRating() {
  const agg = await db.review.aggregate({ where: { source: 'GOOGLE' }, _avg: { rating: true }, _count: true });
  return { average: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : null, count: agg._count };
}
