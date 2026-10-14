'use client';

import Link from 'next/link';
import { useState } from 'react';
import { formatPrice } from '@/lib/format';

interface CategoryGroup {
  slug: string;
  name: string;
  dishes: { id: number; name: string; image: string; price: number }[];
}

export function Categories({ groups }: { groups: CategoryGroup[] }) {
  const [active, setActive] = useState(groups[0]?.slug);
  const current = groups.find((g) => g.slug === active) ?? groups[0];
  if (!current) return null;

  return (
    <div className="s-categories">
      <section className="categories">
        <div className="container">
          <div className="section-header reveal">
            <h2>Explorer par catégorie</h2>
            <p>Des saveurs du monde entier, rassemblées pour vous</p>
          </div>

          <div className="cat-tabs reveal">
            {groups.map((cat) => (
              <button key={cat.slug} className={`cat-tab${cat.slug === current.slug ? ' active' : ''}`} onClick={() => setActive(cat.slug)}>
                {cat.name}
              </button>
            ))}
          </div>

          {/* key = category, so the cards re-run their entrance animation on every tab change */}
          <div className="dish-grid" key={current.slug}>
            {current.dishes.map((dish, i) => (
              <Link
                href={`/menus?category=${current.slug}`}
                className="dish-card reveal reveal-zoom"
                style={{ ['--i' as string]: i }}
                key={dish.id}
              >
                <div className="dish-img">
                  <img src={dish.image} alt={dish.name} className="dish-img-content" loading="lazy" />
                  <div className="dish-badge">dès {formatPrice(dish.price)}</div>
                </div>
                <div className="dish-name">{dish.name}</div>
              </Link>
            ))}
          </div>

          <div className="section-cta">
            <Link href="/menus" className="btn-outline">
              Voir plus
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
