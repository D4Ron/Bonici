import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { listRestaurants } from '@/lib/catalog';
import { RestaurantList } from './RestaurantList';

export const metadata: Metadata = { title: 'Nos restaurants' };
export const dynamic = 'force-dynamic';

export default async function RestaurantsPage() {
  const [restaurants, ratings] = await Promise.all([
    listRestaurants(),
    db.review.groupBy({ by: ['restaurantId'], where: { source: 'GOOGLE' }, _avg: { rating: true }, _count: true }),
  ]);
  return (
    <RestaurantList
      restaurants={restaurants.map((r) => {
        const rating = ratings.find((x) => x.restaurantId === r.id);
        return {
          id: r.id,
          slug: r.slug,
          name: r.name,
          address: r.address,
          city: r.city,
          phone: r.phone,
          openingHours: r.openingHours,
          googleMapsUrl: r.googleMapsUrl,
          googleReviewUrl: r.googleReviewUrl,
          latitude: r.latitude,
          longitude: r.longitude,
          services: [r.deliveryEnabled && 'Livraison', r.takeawayEnabled && 'À emporter'].filter(Boolean).join(' · '),
          rating: rating?._avg.rating ? { average: Math.round(rating._avg.rating * 10) / 10, count: rating._count } : null,
        };
      })}
    />
  );
}
