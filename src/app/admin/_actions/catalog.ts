'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireAdmin, requireStaff } from '@/lib/auth';
import { canManageRestaurant } from '@/lib/permissions';
import { slugify } from '@/lib/format';
import { deleteUpload, hasFile, saveUpload } from '@/lib/uploads';
import { bool, date, fail, handle, int, optInt, required, str } from '../_lib/form';

const refreshSite = () => revalidatePath('/', 'layout');

async function imageFrom(form: FormData, folder: string, current?: string | null): Promise<string | null | undefined> {
  const file = form.get('image');
  if (!hasFile(file)) return undefined; // unchanged
  const saved = await saveUpload(file, 'image', folder);
  await deleteUpload(current);
  return saved;
}

// ---- Restaurants -------------------------------------------------------------

function coordinate(form: FormData, key: string, limit: number): number | null {
  const v = str(form, key).replace(',', '.');
  if (!v) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || Math.abs(n) > limit) fail(`Coordonnée invalide (${key}).`);
  return n;
}

export async function saveRestaurant(id: number | null, form: FormData) {
  await handle(id ? `/admin/restaurants/${id}` : '/admin/restaurants/nouveau', async () => {
    await requireAdmin();
    const name = required(form, 'name', 'Le nom');
    const existing = id ? await db.restaurant.findUnique({ where: { id } }) : null;
    const cover = await imageFrom(form, 'restaurants', existing?.coverImage);
    const data = {
      name,
      slug: slugify(str(form, 'slug') || name),
      description: str(form, 'description'),
      address: required(form, 'address', "L'adresse"),
      city: required(form, 'city', 'La ville'),
      phone: str(form, 'phone'),
      email: str(form, 'email'),
      openingHours: str(form, 'openingHours'),
      googleMapsUrl: str(form, 'googleMapsUrl'),
      googleReviewUrl: str(form, 'googleReviewUrl'),
      latitude: coordinate(form, 'latitude', 90),
      longitude: coordinate(form, 'longitude', 180),
      deliveryEnabled: bool(form, 'deliveryEnabled'),
      takeawayEnabled: bool(form, 'takeawayEnabled'),
      deliveryFee: int(form, 'deliveryFee'),
      minimumOrder: int(form, 'minimumOrder'),
      isActive: bool(form, 'isActive'),
      position: int(form, 'position', { max: 999 }),
      odooWarehouseId: optInt(form, 'odooWarehouseId'),
      ...(cover !== undefined && { coverImage: cover }),
    };
    for (const url of [data.googleMapsUrl, data.googleReviewUrl]) {
      if (url && !/^https:\/\//.test(url)) fail('Les liens Google doivent commencer par https://');
    }
    if (!data.googleMapsUrl && data.latitude !== null && data.longitude !== null) {
      data.googleMapsUrl = `https://www.google.com/maps?q=${data.latitude},${data.longitude}`;
    }
    if (id) await db.restaurant.update({ where: { id }, data });
    else await db.restaurant.create({ data });
    refreshSite();
    return '/admin/restaurants';
  });
}

export async function deleteRestaurant(id: number) {
  await handle('/admin/restaurants', async () => {
    await requireAdmin();
    if (await db.order.count({ where: { restaurantId: id } })) {
      fail('Ce restaurant a des commandes : désactivez-le plutôt que de le supprimer.');
    }
    const r = await db.restaurant.delete({ where: { id } });
    await deleteUpload(r.coverImage);
    refreshSite();
  }, 'Restaurant supprimé.');
}

/** Saves a restaurant's whole menu table (admins: prices too; managers: availability only). */
export async function saveMenu(restaurantId: number, form: FormData) {
  await handle(`/admin/restaurants/${restaurantId}/menu`, async () => {
    const user = await requireStaff();
    if (!canManageRestaurant(user, restaurantId)) fail('Accès refusé.');
    const isAdmin = user.role === 'ADMIN';
    const dishes = await db.dish.findMany({ select: { id: true } });
    const special = optInt(form, 'dailySpecial');

    await db.$transaction(async (tx) => {
      for (const { id: dishId } of dishes) {
        const onMenu = bool(form, `on-${dishId}`);
        const existing = await tx.menuItem.findUnique({ where: { restaurantId_dishId: { restaurantId, dishId } } });
        if (isAdmin && !onMenu) {
          if (existing) await tx.menuItem.delete({ where: { id: existing.id } });
          continue;
        }
        if (!isAdmin && !existing) continue; // managers can't add dishes to the menu
        const data = {
          isAvailable: bool(form, `available-${dishId}`),
          isDailySpecial: special === dishId,
          ...(isAdmin && { price: optInt(form, `price-${dishId}`) }),
        };
        if (existing) await tx.menuItem.update({ where: { id: existing.id }, data });
        else await tx.menuItem.create({ data: { ...data, restaurantId, dishId } });
      }
    });
    refreshSite();
  }, 'Carte enregistrée.');
}

// ---- Categories --------------------------------------------------------------

export async function saveCategory(id: number | null, form: FormData) {
  await handle(id ? `/admin/categories/${id}` : '/admin/categories/nouveau', async () => {
    await requireAdmin();
    const name = required(form, 'name', 'Le nom');
    const existing = id ? await db.category.findUnique({ where: { id } }) : null;
    const image = await imageFrom(form, 'categories', existing?.image);
    const data = {
      name,
      slug: slugify(str(form, 'slug') || name),
      position: int(form, 'position', { max: 999 }),
      isActive: bool(form, 'isActive'),
      ...(image !== undefined && { image }),
    };
    if (id) await db.category.update({ where: { id }, data });
    else await db.category.create({ data });
    refreshSite();
    return '/admin/categories';
  });
}

export async function deleteCategory(id: number) {
  await handle('/admin/categories', async () => {
    await requireAdmin();
    if (await db.dish.count({ where: { categoryId: id } })) fail("Cette catégorie contient des plats : déplacez-les d'abord.");
    const c = await db.category.delete({ where: { id } });
    await deleteUpload(c.image);
    refreshSite();
  }, 'Catégorie supprimée.');
}

// ---- Dishes --------------------------------------------------------------------

/** "Moyenne = 6000" lines → [{ label, price, position }]. */
function parseVariants(text: string) {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line, position) => {
      const m = line.match(/^(.+?)\s*[=:]\s*([\d\s.]+)$/);
      if (!m) fail(`Taille / variante invalide : « ${line} ». Format attendu : Grande = 6500`);
      const price = Number(m[2].replace(/[\s.]/g, ''));
      if (!Number.isInteger(price) || price < 1) fail(`Prix invalide pour « ${m[1]} ».`);
      return { label: m[1].trim(), price, position };
    });
}

export async function saveDish(id: number | null, form: FormData) {
  await handle(id ? `/admin/plats/${id}` : '/admin/plats/nouveau', async () => {
    await requireAdmin();
    const variants = parseVariants(str(form, 'variants'));
    if (variants.length === 1) fail('Une seule variante : indiquez plutôt le prix de base du plat.');
    const existing = id ? await db.dish.findUnique({ where: { id } }) : null;
    const image = await imageFrom(form, 'dishes', existing?.image);
    const data = {
      name: required(form, 'name', 'Le nom'),
      description: str(form, 'description'),
      // With variants, the base price is the cheapest one (used for "dès …" and sorting).
      basePrice: variants.length ? Math.min(...variants.map((v) => v.price)) : int(form, 'basePrice', { min: 1 }),
      categoryId: int(form, 'categoryId', { min: 1 }),
      isActive: bool(form, 'isActive'),
      isFeatured: bool(form, 'isFeatured'),
      odooProductId: optInt(form, 'odooProductId'),
      ...(image !== undefined && { image }),
    };
    if (id) {
      await db.dish.update({ where: { id }, data: { ...data, variants: { deleteMany: {}, create: variants } } });
    } else {
      // New dishes go on every restaurant's menu; untick them per branch afterwards.
      const restaurants = await db.restaurant.findMany({ select: { id: true } });
      await db.dish.create({
        data: { ...data, variants: { create: variants }, menuItems: { create: restaurants.map((r) => ({ restaurantId: r.id })) } },
      });
    }
    refreshSite();
    return '/admin/plats';
  });
}

export async function deleteDish(id: number) {
  await handle('/admin/plats', async () => {
    await requireAdmin();
    // Past orders keep their own copy of the name and price, so deleting is safe.
    const d = await db.dish.delete({ where: { id } });
    await deleteUpload(d.image);
    refreshSite();
  }, 'Plat supprimé.');
}

// ---- Promotions ------------------------------------------------------------------

export async function savePromotion(id: number | null, form: FormData) {
  await handle(id ? `/admin/promotions/${id}` : '/admin/promotions/nouveau', async () => {
    await requireAdmin();
    const dishIds = form.getAll('dishes').map(Number).filter(Number.isInteger);
    if (dishIds.length === 0) fail('Choisissez au moins un plat.');
    const startsAt = date(form, 'startsAt', 'Début');
    const endsAt = date(form, 'endsAt', 'Fin');
    if (endsAt <= startsAt) fail('La fin doit être après le début.');
    const data = {
      title: required(form, 'title', 'Le titre'),
      restaurantId: optInt(form, 'restaurantId'),
      discountPercent: int(form, 'discountPercent', { min: 1, max: 90 }),
      startsAt,
      endsAt,
      isActive: bool(form, 'isActive'),
    };
    const dishes = dishIds.map((d) => ({ id: d }));
    if (id) await db.promotion.update({ where: { id }, data: { ...data, dishes: { set: dishes } } });
    else await db.promotion.create({ data: { ...data, dishes: { connect: dishes } } });
    refreshSite();
    return '/admin/promotions';
  });
}

export async function deletePromotion(id: number) {
  await handle('/admin/promotions', async () => {
    await requireAdmin();
    await db.promotion.delete({ where: { id } });
    refreshSite();
  }, 'Promotion supprimée.');
}
