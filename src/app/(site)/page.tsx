import Link from 'next/link';
import { db } from '@/lib/db';
import {
  currentPromotions, featuredReviews, googleRating, homeDishesByCategory, listRestaurants, popularDishes,
} from '@/lib/catalog';
import { formatPrice, formatRelative } from '@/lib/format';
import { Hero } from '@/components/home/Hero';
import { Categories } from '@/components/home/Categories';
import { PopularDishes } from '@/components/home/PopularDishes';
import { HowItWorks } from '@/components/home/HowItWorks';
import { Testimonials } from '@/components/home/Testimonials';
import { Cta } from '@/components/home/Cta';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [restaurants, dishCount, rating, promotions, groups, popular, reviews] = await Promise.all([
    listRestaurants(),
    db.dish.count({ where: { isActive: true, menuItems: { some: {} } } }),
    googleRating(),
    currentPromotions(),
    homeDishesByCategory(),
    popularDishes(),
    featuredReviews(8),
  ]);

  // Real figures only — the old site showed made-up "500+ plats / 4.8★".
  const stats = [
    { value: String(restaurants.length), label: restaurants.length > 1 ? 'Restaurants' : 'Restaurant' },
    ...(dishCount > 0 ? [{ value: String(dishCount), label: 'Plats au menu' }] : []),
    ...(rating.average ? [{ value: rating.average.toLocaleString('fr-FR'), star: true, label: `${rating.count} avis Google` }] : []),
  ];

  return (
    <>
      <Hero stats={stats} />

      {promotions.length > 0 && (
        <div className="s-home">
          <div className="promotions-section">
            <h2 className="reveal">Promotions du moment</h2>
            <div className="promotions-grid">
              {promotions.map((p, i) => (
                <div className="promo-card reveal" style={{ ['--i' as string]: i }} key={p.id}>
                  <div className="promo-badge">-{p.discountPercent}%</div>
                  <div className="promo-info">
                    <h3>{p.title || p.dishNames.join(', ')}</h3>
                    <p className="resto-name">{p.restaurantName}</p>
                    <p className="old-price">{formatPrice(p.price)}</p>
                    <p className="new-price">{formatPrice(p.newPrice)}</p>
                    <Link href={p.restaurantSlug ? `/menus?restaurant=${p.restaurantSlug}` : '/menus'} className="btn-promo">
                      Voir le menu
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <Categories groups={groups} />
      <PopularDishes dishes={popular} />
      <HowItWorks />
      <Testimonials
        rating={rating}
        reviews={reviews.map((r) => ({
          id: r.id,
          author: r.author,
          rating: r.rating,
          text: r.text,
          restaurantName: r.restaurant?.name ?? null,
          when: formatRelative(r.publishedAt),
        }))}
      />
      <Cta />
    </>
  );
}
