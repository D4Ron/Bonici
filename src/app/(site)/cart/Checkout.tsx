'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { placeOrder, quoteCart, type QuoteResult } from '@/app/actions/orders';
import { useCart } from '@/components/cart/CartProvider';
import { formatPrice } from '@/lib/format';
import { lineKey } from '@/lib/pricing';
import { rememberOrder } from '@/lib/recent-orders';
import { Icon } from '@/components/Icon';

type Mode = 'DELIVERY' | 'TAKEAWAY';

export function Checkout({ customer }: { customer: { name: string; phone: string; email: string } | null }) {
  const cart = useCart();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('DELIVERY');
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [placing, startPlacing] = useTransition();
  const [form, setForm] = useState({
    customerName: customer?.name ?? '',
    customerPhone: customer?.phone ?? '',
    customerEmail: customer?.email ?? '',
    address: '',
    notes: '',
  });

  const restaurantId = cart.restaurant?.id;
  const itemsKey = JSON.stringify(cart.items.map((i) => [i.key, i.quantity]));

  // Ask the server for the real prices whenever the cart or the mode changes.
  useEffect(() => {
    if (!restaurantId || cart.items.length === 0) { setQuote(null); return; }
    let cancelled = false;
    setQuoting(true);
    const t = setTimeout(async () => {
      const q = await quoteCart({ restaurantId, mode, items: cart.items.map((i) => ({ dishId: i.dishId, variantId: i.variantId, quantity: i.quantity })) });
      if (cancelled) return;
      setQuote(q);
      setQuoting(false);
      // Switch automatically if the branch only offers the other mode.
      if (q.restaurant && mode === 'DELIVERY' && !q.restaurant.deliveryEnabled && q.restaurant.takeawayEnabled) setMode('TAKEAWAY');
      if (q.restaurant && mode === 'TAKEAWAY' && !q.restaurant.takeawayEnabled && q.restaurant.deliveryEnabled) setMode('DELIVERY');
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId, itemsKey, mode]);

  const set = (field: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;
    setErrors([]);
    startPlacing(async () => {
      const res = await placeOrder({ ...form, restaurantId, mode, items: cart.items.map((i) => ({ dishId: i.dishId, variantId: i.variantId, quantity: i.quantity })) });
      if (!res.ok) { setErrors(res.errors); return; }
      rememberOrder({ token: res.token, id: res.id, placedAt: new Date().toISOString(), restaurant: cart.restaurant?.name ?? '' });
      cart.clear();
      router.push(`/suivi/${res.token}?nouvelle=1`);
    });
  };

  if (cart.items.length === 0) {
    return (
      <div className="s-cart">
        <div className="cart-page">
          <div className="cart-container">
            <h1>Mon Panier</h1>
            <div className="empty-cart reveal">
              <div className="empty-icon"><Icon name="cart" size={64} /></div>
              <h2>Votre panier est vide</h2>
              <p>Ajoutez des plats depuis notre menu</p>
              <Link href="/menus" className="btn-shop">Voir le menu</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const lines = new Map(quote?.lines.map((l) => [lineKey(l.dishId, l.variantId), l]));
  const r = quote?.restaurant;
  const blocking = [...(quote?.errors ?? []), ...errors];

  return (
    <div className="s-cart">
      <div className="cart-page">
        <div className="cart-container">
          <h1>Mon Panier</h1>

          <div className="cart-content">
            <div className="cart-items">
              <div className="restaurant-banner">
                <span>Commande chez <strong>{cart.restaurant?.name}</strong></span>
                <Link href={`/menus?restaurant=${cart.restaurant?.slug}`}>+ Ajouter des plats</Link>
              </div>

              {cart.items.map((item, i) => {
                const line = lines.get(item.key);
                const unit = line?.unitPrice ?? item.price;
                return (
                  <div className="cart-item reveal" style={{ ['--i' as string]: i }} key={item.key}>
                    <div className="item-info">
                      <div className="item-image"><img src={item.image} alt={item.name} loading="lazy" /></div>
                      <div className="item-details">
                        <h3>{item.name}</h3>
                        {line && line.discountPercent > 0 && (
                          <span className="promo">-{line.discountPercent}% <span className="old">{formatPrice(line.basePrice)}</span></span>
                        )}
                      </div>
                    </div>
                    <div className="item-price">{formatPrice(unit)}</div>
                    <div className="item-quantity">
                      <button type="button" onClick={() => cart.setQuantity(item.key, item.quantity - 1)} aria-label="Retirer un"><Icon name="minus" size={14} /></button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => cart.setQuantity(item.key, item.quantity + 1)} aria-label="Ajouter un"><Icon name="plus" size={14} /></button>
                    </div>
                    <div className="item-total">{formatPrice(unit * item.quantity)}</div>
                    <button type="button" className="remove-btn" onClick={() => cart.remove(item.key)} aria-label={`Retirer ${item.name}`}><Icon name="trash" /></button>
                  </div>
                );
              })}
            </div>

            <form className="cart-summary" onSubmit={submit}>
              <h3>Récapitulatif</h3>

              <div className="summary-row"><span>Sous-total</span><span className={quoting ? 'shimmer' : undefined}>{formatPrice(quote?.subtotal ?? cart.total)}</span></div>
              {!!quote?.discount && (
                <div className="summary-row"><span>Promotions</span><span>-{formatPrice(quote.discount)}</span></div>
              )}
              <div className="summary-row">
                <span>Frais de livraison</span>
                <span className={quoting ? 'shimmer' : undefined}>{mode === 'DELIVERY' ? formatPrice(r?.deliveryFee ?? 0) : 'Offerts'}</span>
              </div>
              <div className="summary-row total"><span>Total</span><span className={quoting ? 'shimmer' : undefined}>{formatPrice(quote?.total ?? cart.total)}</span></div>

              <div className="delivery-options">
                <label className={`delivery-option${r && !r.deliveryEnabled ? ' disabled' : ''}`}>
                  <input type="radio" name="mode" checked={mode === 'DELIVERY'} onChange={() => setMode('DELIVERY')} disabled={r ? !r.deliveryEnabled : false} />
                  <span><Icon name="truck" size={16} /> Livraison{r ? ` (+${formatPrice(r.deliveryFee)})` : ''}</span>
                </label>
                <label className={`delivery-option${r && !r.takeawayEnabled ? ' disabled' : ''}`}>
                  <input type="radio" name="mode" checked={mode === 'TAKEAWAY'} onChange={() => setMode('TAKEAWAY')} disabled={r ? !r.takeawayEnabled : false} />
                  <span><Icon name="bag" size={16} /> À emporter</span>
                </label>
              </div>

              <div className="field-row">
                <div className="field">
                  <label htmlFor="name">Nom *</label>
                  <input id="name" className="form-control" value={form.customerName} onChange={set('customerName')} required autoComplete="name" />
                </div>
                <div className="field">
                  <label htmlFor="phone">Téléphone *</label>
                  <input id="phone" type="tel" className="form-control" value={form.customerPhone} onChange={set('customerPhone')} required placeholder="90 00 00 00" autoComplete="tel" />
                </div>
              </div>
              <div className="field">
                <label htmlFor="email">Email <small>(facultatif, pour recevoir le suivi)</small></label>
                <input id="email" type="email" className="form-control" value={form.customerEmail} onChange={set('customerEmail')} autoComplete="email" />
              </div>
              {mode === 'DELIVERY' && (
                <div className="field">
                  <label htmlFor="address">Adresse de livraison *</label>
                  <textarea id="address" className="form-control" rows={2} value={form.address} onChange={set('address')} required placeholder="Quartier, rue, repère…" autoComplete="street-address" />
                </div>
              )}
              <div className="field">
                <label htmlFor="notes">Instructions <small>(facultatif)</small></label>
                <input id="notes" className="form-control" value={form.notes} onChange={set('notes')} placeholder="Sans piment, sonner au portail…" />
              </div>

              <div className="payment-note"><Icon name="wallet" size={16} /> Paiement en espèces {mode === 'DELIVERY' ? 'à la livraison' : 'au retrait'}.</div>

              {blocking.length > 0 && (
                <div className="alert-error" role="alert"><ul>{blocking.map((e) => <li key={e}>{e}</li>)}</ul></div>
              )}

              <button className="btn-order" type="submit" disabled={placing || quoting || (quote?.errors.length ?? 0) > 0}>
                {placing ? 'Envoi de la commande…' : 'Valider la commande'}
              </button>

              {!customer && (
                <p className="account-hint">
                  Pas besoin de compte. <Link href="/login?next=/cart">Connectez-vous</Link> pour retrouver vos commandes plus tard.
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
