'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { MenuDish } from '@/lib/catalog';
import { formatPrice } from '@/lib/format';
import { useCart, type CartRestaurant, type NewCartLine } from '@/components/cart/CartProvider';
import { Icon } from '@/components/Icon';

interface Props {
  restaurants: CartRestaurant[];
  restaurant: CartRestaurant | null;
  categories: { slug: string; name: string }[];
  dishes: MenuDish[];
  initialSearch: string;
  initialCategory: string;
}

const todayLabel = () =>
  new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Lome' });

export function MenuBrowser({ restaurants, restaurant, categories, dishes, initialSearch, initialCategory }: Props) {
  const router = useRouter();
  const cart = useCart();
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [gridView, setGridView] = useState(true);
  const [conflict, setConflict] = useState<NewCartLine | null>(null);
  // Chosen size/flavour per dish (index into dish.variants).
  const [choice, setChoice] = useState<Record<number, number>>({});
  const chosen = (dish: MenuDish) => dish.variants[choice[dish.id] ?? 0] ?? dish.variants[0];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return dishes.filter((d) =>
      (!q || d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q)) &&
      (!category || d.categorySlug === category) &&
      (!availableOnly || d.isAvailable));
  }, [dishes, search, category, availableOnly]);

  const special = dishes.find((d) => d.isDailySpecial && d.isAvailable);

  const addToCart = (dish: MenuDish, openDrawer = false) => {
    if (!restaurant || !dish.isAvailable) return;
    const v = chosen(dish);
    const line: NewCartLine = {
      dishId: dish.id,
      variantId: v.id,
      name: v.label ? `${dish.name} (${v.label})` : dish.name,
      price: v.price,
      image: dish.image,
    };
    if (cart.add(restaurant, line) === 'conflict') setConflict(line);
    else if (openDrawer) cart.open();
  };

  const switchRestaurant = (slug: string) => {
    const params = new URLSearchParams({ restaurant: slug });
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    router.push(`/menus?${params}`, { scroll: false });
  };

  const reset = () => { setSearch(''); setCategory(''); setAvailableOnly(false); };

  return (
    <div className="s-menus">
      <div className="menus-page">
        <div className="menus-hero">
          <h1>Nos <em>Menus</em></h1>
          <p>{restaurant ? `La carte de ${restaurant.name}` : 'Explorez notre carte multiculturelle'}</p>
          <div className="search-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un plat..." aria-label="Rechercher un plat" />
            {search && <button onClick={() => setSearch('')} aria-label="Effacer"><Icon name="x" size={16} /></button>}
          </div>
        </div>

        <div className="menus-body">
          <aside className="filters">
            <h3>Filtres</h3>

            {restaurants.length > 1 && (
              <div className="filter-group">
                <label className="filter-label">Restaurant</label>
                <div className="chips restaurant-chips">
                  {restaurants.map((r) => (
                    <button key={r.id} className={`chip${r.id === restaurant?.id ? ' active' : ''}`} onClick={() => switchRestaurant(r.slug)}>
                      {r.name.replace(/^Bonici\s*/i, '')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="filter-group">
              <label className="filter-label">Catégorie</label>
              <div className="chips">
                <button className={`chip${category === '' ? ' active' : ''}`} onClick={() => setCategory('')}>Tous</button>
                {categories.map((c) => (
                  <button key={c.slug} className={`chip${category === c.slug ? ' active' : ''}`} onClick={() => setCategory(c.slug)}>{c.name}</button>
                ))}
              </div>
            </div>

            <label className="toggle-label">
              <input type="checkbox" checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)} />
              <span className="toggle" />
              Disponibles uniquement
            </label>
          </aside>

          <main className="dishes-main">
            <div className="toolbar">
              <span>{filtered.length} plat(s)</span>
              <div className="view-btns">
                <button className={gridView ? 'active' : undefined} onClick={() => setGridView(true)} aria-label="Vue grille"><Icon name="grid" size={16} /></button>
                <button className={!gridView ? 'active' : undefined} onClick={() => setGridView(false)} aria-label="Vue liste"><Icon name="list" size={16} /></button>
              </div>
            </div>

            {special && !search && !category && (
              <div className="daily-special-card reveal">
                <div className="special-badge">
                  <span><Icon name="utensils" size={16} /> MENU DU JOUR</span>
                  <span className="date">{todayLabel()}</span>
                </div>
                <div className="special-content">
                  <img src={special.image} alt={special.name} />
                  <div className="special-info">
                    <h2>{special.name}</h2>
                    <p>{special.description}</p>
                    <div className="price-row">
                      {special.discount > 0 && <span className="old-price">{formatPrice(special.originalPrice)}</span>}
                      <span className="special-price">{special.variants.length > 1 && 'dès '}{formatPrice(special.price)}</span>
                      {special.discount > 0 && <span className="discount-badge">-{special.discount}%</span>}
                    </div>
                    <button onClick={() => addToCart(special, true)} className="btn-special">Commander maintenant</button>
                  </div>
                </div>
              </div>
            )}

            <div className={`dish-grid${gridView ? '' : ' list-view'}`}>
              {filtered.map((dish, i) => (
                <div className={`dish-card reveal${dish.isAvailable ? '' : ' unavailable'}`} style={{ ['--i' as string]: i % 6 }} key={dish.id}>
                  <div className="dish-img-wrap">
                    <div className="dish-img">
                      <img src={dish.image} alt={dish.name} loading="lazy" />
                    </div>
                    {!dish.isAvailable && <div className="unavail-badge">Rupture</div>}
                    {dish.discount > 0 && <div className="discount-badge-img">-{dish.discount}%</div>}
                    <button className="quick-add" disabled={!dish.isAvailable} onClick={() => addToCart(dish)} title="Ajouter rapidement" aria-label={`Ajouter ${dish.name}`}><Icon name="plus" size={18} /></button>
                  </div>

                  <div className="dish-body">
                    <div className="dish-cat">{dish.categoryName}</div>
                    <h4>{dish.name}</h4>
                    {dish.description && <p className="dish-desc">{dish.description}</p>}
                    {dish.variants.length > 1 && (
                      <div className="variant-picker" role="radiogroup" aria-label={`Choix pour ${dish.name}`}>
                        {dish.variants.map((v, vi) => (
                          <button
                            key={v.id ?? vi}
                            type="button"
                            role="radio"
                            aria-checked={chosen(dish) === v}
                            className={chosen(dish) === v ? 'active' : undefined}
                            onClick={() => setChoice((c) => ({ ...c, [dish.id]: vi }))}
                          >
                            {v.label}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="dish-footer">
                      <div className="dish-price">
                        {dish.discount > 0 ? (
                          <div className="price-promo">
                            <span className="new-price">{formatPrice(chosen(dish).price)}</span>
                            <span className="old-price">{formatPrice(chosen(dish).originalPrice)}</span>
                          </div>
                        ) : (
                          <div className="price-normal"><span>{formatPrice(chosen(dish).price)}</span></div>
                        )}
                      </div>
                      <button className="btn-add" disabled={!dish.isAvailable} onClick={() => addToCart(dish)}>
                        {dish.isAvailable ? 'Ajouter' : 'Indisponible'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="no-results">
                  <div className="no-results-icon"><Icon name="utensils" size={48} /></div>
                  <h3>Aucun plat trouvé</h3>
                  <p>{dishes.length === 0 ? "La carte de ce restaurant n'est pas encore en ligne." : 'Ajustez vos filtres'}</p>
                  {dishes.length > 0 && <button onClick={reset}>Réinitialiser</button>}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {conflict && restaurant && (
        <div className="confirm-overlay" onClick={() => setConflict(null)}>
          <div className="confirm-box" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h3>Nouveau panier ?</h3>
            <p>
              Votre panier contient des plats de <strong>{cart.restaurant?.name}</strong>. Une commande ne peut venir que d&apos;un seul
              restaurant : voulez-vous vider le panier et commander chez <strong>{restaurant.name}</strong> ?
            </p>
            <div className="actions">
              <button onClick={() => setConflict(null)}>Garder mon panier</button>
              <button
                className="primary"
                onClick={() => {
                  cart.replaceWith(restaurant, conflict);
                  setConflict(null);
                }}
              >
                Vider et ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
