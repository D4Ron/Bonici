import { describe, expect, it } from 'vitest';
import { bestDiscount, computeQuote, discountedPrice, MAX_QUANTITY } from '@/lib/pricing';

const restaurant = { deliveryEnabled: true, takeawayEnabled: true, deliveryFee: 500, minimumOrder: 0 };
const menu = [
  { dishId: 1, variantId: null, name: 'Demi poulet rôti', price: 3500, isAvailable: true },
  { dishId: 2, variantId: null, name: 'Pizza Chef', price: 8000, isAvailable: true },
  { dishId: 3, variantId: null, name: 'Cuisse de poulet', price: 5500, isAvailable: false },
  // A dish sold in two sizes.
  { dishId: 4, variantId: 41, name: 'Pizza Bonici (Moyenne)', price: 6000, isAvailable: true },
  { dishId: 4, variantId: 42, name: 'Pizza Bonici (Grande)', price: 6500, isAvailable: true },
];

describe('variants', () => {
  it('prices each size separately and keeps them as separate lines', () => {
    const q = computeQuote({
      restaurant, menu, promotions: [],
      items: [{ dishId: 4, variantId: 41, quantity: 1 }, { dishId: 4, variantId: 42, quantity: 2 }],
      mode: 'TAKEAWAY',
    });
    expect(q.errors).toEqual([]);
    expect(q.lines.map((l) => [l.name, l.unitPrice, l.quantity])).toEqual([
      ['Pizza Bonici (Moyenne)', 6000, 1],
      ['Pizza Bonici (Grande)', 6500, 2],
    ]);
    expect(q.total).toBe(19000);
  });

  it('refuses a dish with variants ordered without choosing one, or with a variant of another dish', () => {
    const q = computeQuote({ restaurant, menu, promotions: [], items: [{ dishId: 4, quantity: 1 }, { dishId: 1, variantId: 42, quantity: 1 }], mode: 'TAKEAWAY' });
    expect(q.lines).toHaveLength(0);
    expect(q.errors).toHaveLength(2);
  });

  it('applies a dish promotion to every size', () => {
    const q = computeQuote({
      restaurant, menu, promotions: [{ discountPercent: 10, dishIds: [4] }],
      items: [{ dishId: 4, variantId: 42, quantity: 1 }], mode: 'TAKEAWAY',
    });
    expect(q.lines[0].unitPrice).toBe(5850);
  });
});

describe('computeQuote', () => {
  it('uses the restaurant price, not anything sent by the browser', () => {
    const q = computeQuote({ restaurant, menu, promotions: [], items: [{ dishId: 1, quantity: 2 }], mode: 'TAKEAWAY' });
    expect(q.errors).toEqual([]);
    expect(q.lines[0]).toMatchObject({ unitPrice: 3500, lineTotal: 7000 });
    expect(q.total).toBe(7000);
  });

  it('applies promotions and reports the discount', () => {
    const q = computeQuote({
      restaurant, menu,
      promotions: [{ discountPercent: 15, dishIds: [2] }],
      items: [{ dishId: 2, quantity: 1 }, { dishId: 1, quantity: 1 }],
      mode: 'TAKEAWAY',
    });
    expect(q.subtotal).toBe(11500);
    expect(q.discount).toBe(1200);
    expect(q.total).toBe(10300);
  });

  it('adds the branch delivery fee only for delivery', () => {
    const items = [{ dishId: 1, quantity: 1 }];
    expect(computeQuote({ restaurant: { ...restaurant, deliveryFee: 700 }, menu, promotions: [], items, mode: 'DELIVERY' }).total).toBe(4200);
    expect(computeQuote({ restaurant: { ...restaurant, deliveryFee: 700 }, menu, promotions: [], items, mode: 'TAKEAWAY' }).total).toBe(3500);
  });

  it('refuses unavailable dishes and dishes from another restaurant', () => {
    const q = computeQuote({ restaurant, menu, promotions: [], items: [{ dishId: 3, quantity: 1 }, { dishId: 99, quantity: 1 }], mode: 'TAKEAWAY' });
    expect(q.lines).toHaveLength(0);
    expect(q.errors).toHaveLength(2);
  });

  it('enforces the minimum order on the discounted amount', () => {
    const q = computeQuote({ restaurant: { ...restaurant, minimumOrder: 4000 }, menu, promotions: [], items: [{ dishId: 1, quantity: 1 }], mode: 'TAKEAWAY' });
    expect(q.errors.join()).toMatch(/minimum/);
  });

  it('blocks a mode the restaurant has switched off', () => {
    const q = computeQuote({ restaurant: { ...restaurant, deliveryEnabled: false }, menu, promotions: [], items: [{ dishId: 1, quantity: 1 }], mode: 'DELIVERY' });
    expect(q.errors.join()).toMatch(/livre pas/);
  });

  it('merges duplicate lines, ignores bad quantities and caps large ones', () => {
    const q = computeQuote({
      restaurant, menu, promotions: [],
      items: [{ dishId: 1, quantity: 1 }, { dishId: 1, quantity: 2 }, { dishId: 2, quantity: 0 }, { dishId: 2, quantity: 999 }],
      mode: 'TAKEAWAY',
    });
    expect(q.lines.find((l) => l.dishId === 1)?.quantity).toBe(3);
    expect(q.lines.find((l) => l.dishId === 2)?.quantity).toBe(MAX_QUANTITY);
  });

  it('reports an empty cart', () => {
    expect(computeQuote({ restaurant, menu, promotions: [], items: [], mode: 'TAKEAWAY' }).errors).toEqual(['Votre panier est vide.']);
  });
});

describe('promotions', () => {
  it('never stacks: the biggest discount wins', () => {
    expect(bestDiscount(1, [{ discountPercent: 10, dishIds: [1] }, { discountPercent: 25, dishIds: [1, 2] }])).toBe(25);
    expect(bestDiscount(3, [{ discountPercent: 10, dishIds: [1] }])).toBe(0);
  });

  it('rounds to whole FCFA', () => {
    expect(discountedPrice(3500, 15)).toBe(2975);
    expect(discountedPrice(1999, 33)).toBe(1339);
  });
});
