'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icon, Star } from '@/components/Icon';

export interface TestimonialReview {
  id: number;
  author: string;
  rating: number;
  text: string;
  restaurantName: string | null;
  when: string;
}

const ROTATE_MS = 7000;

export function Testimonials({ reviews, rating }: { reviews: TestimonialReview[]; rating: { average: number | null; count: number } }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || reviews.length < 2) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % reviews.length), ROTATE_MS);
    return () => clearTimeout(t);
  }, [index, paused, reviews.length]);

  const review = reviews[index];

  return (
    <div className="s-testimonials">
      <div className="testimonials">
        <div className="container">
          <div className="testi-header reveal">
            <h2>Ce que nos clients disent</h2>
            <p>Des avis authentiques laissés sur Google</p>
            {rating.average && (
              <div className="rating-summary">
                <strong>{rating.average.toLocaleString('fr-FR')} <Star size={14} /></strong> de moyenne sur {rating.count} avis Google
              </div>
            )}
          </div>

          {review ? (
            <>
              <div className="testi-card reveal reveal-zoom" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
                <div className="testi-content" key={review.id}>
                  <div className="stars" aria-label={`${review.rating} étoiles sur 5`}>
                    {[1, 2, 3, 4, 5].map((s) => <Star key={s} on={s <= review.rating} size={22} />)}
                  </div>
                  <blockquote>{review.text}</blockquote>
                  <div className="author-name">{review.author}</div>
                  <div className="author-title">{[review.restaurantName, review.when].filter(Boolean).join(' · ')}</div>
                  <div className="google-badge">
                    <svg width="12" height="12" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" /><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z" /><path fill="#FBBC05" d="M10.5 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.6 10.7l7.9-6.1z" /><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.2-8.5 2.2-6.3 0-11.6-4.1-13.5-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z" /></svg>
                    Avis Google
                  </div>
                </div>
              </div>
              {reviews.length > 1 && (
                <div className="dots">
                  {reviews.map((r, i) => (
                    <button key={r.id} className={`dot${i === index ? ' active' : ''}`} onClick={() => setIndex(i)} aria-label={`Avis ${i + 1}`} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="empty">Aucun avis pour le moment.</p>
          )}

          <div className="text-center" style={{ marginTop: 28 }}>
            <Link href="/avis" className="btn-outline">Voir tous les avis <Icon name="arrowRight" size={16} /></Link>
          </div>
        </div>
      </div>
    </div>
  );
}
