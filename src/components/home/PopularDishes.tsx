'use client';

import Link from 'next/link';
import { useState } from 'react';
import { formatPrice } from '@/lib/format';

const PAGE_SIZE = 4;

export function PopularDishes({ dishes }: { dishes: { id: number; name: string; category: string; image: string; price: number }[] }) {
  const [page, setPage] = useState(0);
  if (dishes.length === 0) return null;

  const visible = dishes.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const canPrev = page > 0;
  const canNext = (page + 1) * PAGE_SIZE < dishes.length;

  return (
    <div className="s-popular">
      <section className="popular">
        <div className="container">
          <div className="pop-header reveal">
            <div>
              <h2>Les Plats Les Plus<br />Populaires</h2>
              <p>Plébiscités par nos clients</p>
            </div>
            <div className="caro-btns">
              <button className="caro-btn" onClick={() => setPage((p) => p - 1)} disabled={!canPrev} aria-label="Précédent">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <button className="caro-btn" onClick={() => setPage((p) => p + 1)} disabled={!canNext} aria-label="Suivant">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </div>
          </div>

          <div className="dish-grid" key={page}>
            {visible.map((dish, i) => (
              <Link href={`/menus?search=${encodeURIComponent(dish.name)}`} className="pop-card reveal" style={{ ['--i' as string]: i }} key={dish.id}>
                <div className="pop-img">
                  <img src={dish.image} alt={dish.name} loading="lazy" />
                </div>
                <div className="pop-info">
                  <div className="pop-name">{dish.name}</div>
                  <div className="pop-meta">
                    <span>{dish.category}</span>
                    <span className="pop-price">{formatPrice(dish.price)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
