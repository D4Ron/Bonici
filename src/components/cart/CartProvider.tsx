'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { lineKey, MAX_QUANTITY } from '@/lib/pricing';
import { Icon } from '@/components/Icon';

// The cart lives in the browser and belongs to one restaurant. Prices stored here
// are only for display; the server recomputes everything at checkout.

export interface CartRestaurant { id: number; slug: string; name: string }
/** One cart line: a dish, or one variant of it (size, flavour). `key` identifies the line. */
export interface CartLine { key: string; dishId: number; variantId: number | null; name: string; price: number; image: string; quantity: number }
export type NewCartLine = Omit<CartLine, 'key' | 'quantity'>;
interface CartData { restaurant: CartRestaurant | null; items: CartLine[] }

type AddResult = 'added' | 'conflict';

interface CartApi extends CartData {
  count: number;
  total: number;
  isOpen: boolean;
  bump: number; // increments on every add, to replay the cart icon animation
  open(): void;
  close(): void;
  add(restaurant: CartRestaurant, dish: NewCartLine): AddResult;
  replaceWith(restaurant: CartRestaurant, dish: NewCartLine): void;
  setQuantity(key: string, quantity: number): void;
  remove(key: string): void;
  clear(): void;
}

const STORAGE_KEY = 'bonici_cart_v3'; // v3: lines carry a variant
const EMPTY: CartData = { restaurant: null, items: [] };
const CartContext = createContext<CartApi | null>(null);

function load(): CartData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const data = JSON.parse(raw) as CartData;
    return Array.isArray(data.items) ? data : EMPTY;
  } catch {
    return EMPTY;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<CartData>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [isOpen, setOpen] = useState(false);
  const [bump, setBump] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { setData(load()); setLoaded(true); }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* storage full or blocked */ }
  }, [data, loaded]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast, bump]);

  const added = useCallback((name: string) => { setBump((b) => b + 1); setToast(`${name} ajouté au panier`); }, []);

  const add = useCallback((restaurant: CartRestaurant, dish: NewCartLine): AddResult => {
    if (data.restaurant && data.restaurant.id !== restaurant.id && data.items.length > 0) return 'conflict';
    const key = lineKey(dish.dishId, dish.variantId);
    setData((d) => {
      const existing = d.items.find((i) => i.key === key);
      const items = existing
        ? d.items.map((i) => (i.key === key ? { ...i, ...dish, quantity: Math.min(i.quantity + 1, MAX_QUANTITY) } : i))
        : [...d.items, { ...dish, key, quantity: 1 }];
      return { restaurant, items };
    });
    added(dish.name);
    return 'added';
  }, [data, added]);

  const replaceWith = useCallback((restaurant: CartRestaurant, dish: NewCartLine) => {
    setData({ restaurant, items: [{ ...dish, key: lineKey(dish.dishId, dish.variantId), quantity: 1 }] });
    added(dish.name);
  }, [added]);

  const setQuantity = useCallback((key: string, quantity: number) => {
    setData((d) => {
      const items = quantity <= 0
        ? d.items.filter((i) => i.key !== key)
        : d.items.map((i) => (i.key === key ? { ...i, quantity: Math.min(quantity, MAX_QUANTITY) } : i));
      return items.length ? { ...d, items } : EMPTY;
    });
  }, []);

  const api = useMemo<CartApi>(() => ({
    ...data,
    count: data.items.reduce((n, i) => n + i.quantity, 0),
    total: data.items.reduce((n, i) => n + i.price * i.quantity, 0),
    isOpen,
    bump,
    open: () => setOpen(true),
    close: () => setOpen(false),
    add,
    replaceWith,
    setQuantity,
    remove: (key) => setQuantity(key, 0),
    clear: () => setData(EMPTY),
  }), [data, isOpen, bump, add, replaceWith, setQuantity]);

  return (
    <CartContext.Provider value={api}>
      {children}
      {toast && (
        <div className="toast" role="status" key={bump}>
          <Icon name="checkCircle" /> {toast}
          <button onClick={() => { setToast(null); setOpen(true); }}>Voir le panier</button>
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart(): CartApi {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
