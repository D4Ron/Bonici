import type { Metadata } from 'next';
import { listCategories, listRestaurants, restaurantMenu } from '@/lib/catalog';
import { MenuBrowser } from './MenuBrowser';

export const metadata: Metadata = { title: 'Nos menus' };
export const dynamic = 'force-dynamic';

export default async function MenusPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const restaurants = await listRestaurants();
  const restaurant = restaurants.find((r) => r.slug === params.restaurant) ?? restaurants[0];
  const [categories, dishes] = await Promise.all([listCategories(), restaurant ? restaurantMenu(restaurant.id) : []]);

  return (
    <MenuBrowser
      key={restaurant?.id}
      restaurants={restaurants.map((r) => ({ id: r.id, slug: r.slug, name: r.name }))}
      restaurant={restaurant ? { id: restaurant.id, slug: restaurant.slug, name: restaurant.name } : null}
      categories={categories.filter((c) => dishes.some((d) => d.categoryId === c.id)).map((c) => ({ slug: c.slug, name: c.name }))}
      dishes={dishes}
      initialSearch={params.search ?? ''}
      initialCategory={params.category ?? ''}
    />
  );
}
