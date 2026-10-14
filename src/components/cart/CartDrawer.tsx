'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { formatPrice } from '@/lib/format';
import { useCart } from './CartProvider';
import { Icon } from '@/components/Icon';

export function CartDrawer() {
  const cart = useCart();
  const router = useRouter();

  useEffect(() => {
    if (!cart.isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && cart.close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cart]);

  return (
    <div className="s-drawer">
      {cart.isOpen && <div className="backdrop" onClick={cart.close} />}

      <aside className={`drawer${cart.isOpen ? ' open' : ''}`} aria-hidden={!cart.isOpen} aria-label="Mon panier">
        <div className="drawer-header">
          <h3>Mon Panier <span className="count">{cart.count}</span></h3>
          <button onClick={cart.close} aria-label="Fermer le panier"><Icon name="x" /></button>
        </div>

        <div className="drawer-body">
          {cart.items.length === 0 ? (
            <div className="empty">
              <span className="empty-icon"><Icon name="cart" size={56} /></span>
              <p>Votre panier est vide</p>
              <Link href="/menus" className="btn-browse" onClick={cart.close}>Explorer le menu</Link>
            </div>
          ) : (
            <>
              {cart.restaurant && <p className="restaurant-line">Commande chez <strong>{cart.restaurant.name}</strong></p>}
              {cart.items.map((item, i) => (
                <div className="item" key={item.key} style={{ ['--i' as string]: i }}>
                  <img className="item-img" src={item.image} alt="" loading="lazy" />
                  <div className="item-info">
                    <div className="item-name">{item.name}</div>
                    <div className="item-price">{formatPrice(item.price)}</div>
                  </div>
                  <div className="item-qty">
                    <button onClick={() => cart.setQuantity(item.key, item.quantity - 1)} aria-label="Retirer un"><Icon name="minus" size={14} /></button>
                    <span>{item.quantity}</span>
                    <button onClick={() => cart.setQuantity(item.key, item.quantity + 1)} aria-label="Ajouter un"><Icon name="plus" size={14} /></button>
                  </div>
                  <button className="item-remove" onClick={() => cart.remove(item.key)} aria-label={`Retirer ${item.name}`}><Icon name="x" size={16} /></button>
                </div>
              ))}
            </>
          )}
        </div>

        {cart.items.length > 0 && (
          <div className="drawer-footer">
            <div className="total">
              <span>Total</span>
              <span className="total-amount">{formatPrice(cart.total)}</span>
            </div>
            <button className="btn-checkout" onClick={() => { cart.close(); router.push('/cart'); }}>Commander</button>
            <button className="btn-clear" onClick={cart.clear}>Vider le panier</button>
          </div>
        )}
      </aside>
    </div>
  );
}
