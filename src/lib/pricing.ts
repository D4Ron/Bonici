// Pure pricing rules. The server is the only place prices are decided; the
// browser's cart only ever sends dish ids and quantities.

export type FulfillmentMode = 'DELIVERY' | 'TAKEAWAY';

export const MAX_QUANTITY = 50;

export interface PricingRestaurant {
  deliveryEnabled: boolean;
  takeawayEnabled: boolean;
  deliveryFee: number;
  minimumOrder: number;
}

/** One orderable thing: a dish, or one variant of a dish (size, flavour…). */
export interface PricingMenuEntry {
  dishId: number;
  variantId: number | null;
  name: string; // includes the variant, e.g. "Pizza Bonici (Grande)"
  price: number; // variant price, else branch price, else the dish base price
  isAvailable: boolean;
}

export interface CartItemInput {
  dishId: number;
  variantId?: number | null;
  quantity: number;
}

export const lineKey = (dishId: number, variantId?: number | null) => `${dishId}:${variantId ?? 0}`;

export interface PricingPromotion {
  discountPercent: number;
  dishIds: number[];
}

export interface QuoteLine {
  dishId: number;
  variantId: number | null;
  name: string;
  basePrice: number;
  discountPercent: number;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Quote {
  lines: QuoteLine[];
  subtotal: number; // before discounts
  discount: number;
  deliveryFee: number;
  total: number;
  errors: string[]; // anything that blocks the order
}

/** Best active discount for a dish; promotions never stack. */
export function bestDiscount(dishId: number, promotions: PricingPromotion[]): number {
  let best = 0;
  for (const p of promotions) {
    if (p.dishIds.includes(dishId)) best = Math.max(best, p.discountPercent);
  }
  return Math.min(Math.max(best, 0), 100);
}

export function discountedPrice(price: number, discountPercent: number): number {
  return Math.round((price * (100 - discountPercent)) / 100);
}

export function computeQuote(input: {
  restaurant: PricingRestaurant;
  menu: PricingMenuEntry[];
  promotions: PricingPromotion[];
  items: CartItemInput[];
  mode: FulfillmentMode;
}): Quote {
  const { restaurant, menu, promotions, items, mode } = input;
  const errors: string[] = [];
  const byKey = new Map(menu.map((m) => [lineKey(m.dishId, m.variantId), m]));

  // Merge duplicate lines for the same dish and variant.
  const quantities = new Map<string, number>();
  for (const it of items) {
    if (!Number.isInteger(it.quantity) || it.quantity < 1) continue;
    const key = lineKey(it.dishId, it.variantId);
    quantities.set(key, (quantities.get(key) ?? 0) + it.quantity);
  }

  const lines: QuoteLine[] = [];
  for (const [key, rawQty] of quantities) {
    const entry = byKey.get(key);
    if (!entry) {
      errors.push("Un plat de votre panier n'est pas proposé par ce restaurant.");
      continue;
    }
    if (!entry.isAvailable) {
      errors.push(`« ${entry.name} » n'est plus disponible.`);
      continue;
    }
    const quantity = Math.min(rawQty, MAX_QUANTITY);
    const discountPercent = bestDiscount(entry.dishId, promotions);
    const unitPrice = discountedPrice(entry.price, discountPercent);
    lines.push({
      dishId: entry.dishId,
      variantId: entry.variantId,
      name: entry.name,
      basePrice: entry.price,
      discountPercent,
      unitPrice,
      quantity,
      lineTotal: unitPrice * quantity,
    });
  }

  if (lines.length === 0 && errors.length === 0) errors.push('Votre panier est vide.');
  if (mode === 'DELIVERY' && !restaurant.deliveryEnabled) errors.push("Ce restaurant ne livre pas pour l'instant.");
  if (mode === 'TAKEAWAY' && !restaurant.takeawayEnabled) errors.push("Ce restaurant ne propose pas la vente à emporter pour l'instant.");

  const subtotal = lines.reduce((s, l) => s + l.basePrice * l.quantity, 0);
  const afterDiscount = lines.reduce((s, l) => s + l.lineTotal, 0);
  const discount = subtotal - afterDiscount;
  const deliveryFee = mode === 'DELIVERY' && lines.length > 0 ? restaurant.deliveryFee : 0;

  if (lines.length > 0 && afterDiscount < restaurant.minimumOrder) {
    errors.push(`Commande minimum : ${restaurant.minimumOrder.toLocaleString('fr-FR')} FCFA.`);
  }

  return { lines, subtotal, discount, deliveryFee, total: afterDiscount + deliveryFee, errors };
}
