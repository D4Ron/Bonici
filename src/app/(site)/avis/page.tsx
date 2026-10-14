import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { SHOWN_REVIEW, googleRating, listRestaurants } from '@/lib/catalog';
import { formatRelative } from '@/lib/format';
import { Icon, Star } from '@/components/Icon';

export const metadata: Metadata = { title: 'Avis clients' };
export const dynamic = 'force-dynamic';

export default async function ReviewsPage() {
  const [reviews, rating, restaurants, perBranch] = await Promise.all([
    db.review.findMany({ where: SHOWN_REVIEW, include: { restaurant: true }, orderBy: [{ publishedAt: 'desc' }] }),
    googleRating(),
    listRestaurants(),
    db.review.groupBy({ by: ['restaurantId'], where: { source: 'GOOGLE' }, _avg: { rating: true }, _count: true }),
  ]);

  return (
    <div className="reviews-page">
      <div className="reviews-hero reveal">
        <h1>Avis <em>clients</em></h1>
        <p>
          {rating.average
            ? `${rating.average.toLocaleString('fr-FR')}/5 de moyenne sur ${rating.count} avis Google. Voici ce qu'ils en disent.`
            : 'Ce que nos clients pensent de Bonici.'}
        </p>
      </div>

      <div className="branch-ratings reveal">
        {restaurants.filter((r) => r.googleReviewUrl).map((r) => {
          const b = perBranch.find((x) => x.restaurantId === r.id);
          return (
            <a key={r.id} href={r.googleReviewUrl} target="_blank" rel="noopener noreferrer">
              {r.name.replace(/^Bonici\s*/i, '')}
              {b?._avg.rating && <> · <strong>{(Math.round(b._avg.rating * 10) / 10).toLocaleString('fr-FR')}/5</strong> ({b._count})</>}
              {' '}<Icon name="external" size={13} />
            </a>
          );
        })}
      </div>

      <div className="reviews-grid">
        {reviews.map((r, i) => (
          <article className="review-tile reveal" style={{ ['--i' as string]: i % 6 }} key={r.id}>
            <div className="stars" aria-label={`${r.rating} étoiles sur 5`}>
              {[1, 2, 3, 4, 5].map((s) => <Star key={s} on={s <= r.rating} />)}
            </div>
            <blockquote>{r.text}</blockquote>
            <div>
              <div className="who">{r.author}</div>
              <div className="where">{[r.restaurant?.name, formatRelative(r.publishedAt), 'Google'].filter(Boolean).join(' · ')}</div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
