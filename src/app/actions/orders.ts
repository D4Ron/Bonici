'use server';

import { after } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser, newToken } from '@/lib/auth';
import { pricingContext } from '@/lib/catalog';
import { computeQuote, MAX_QUANTITY, type Quote } from '@/lib/pricing';
import { customerCanCancel } from '@/lib/order-status';
import { cancelOrderInOdoo, odooConfig, pushOrderToOdoo } from '@/lib/odoo';

const cartSchema = z.object({
  restaurantId: z.number().int().positive(),
  mode: z.enum(['DELIVERY', 'TAKEAWAY']),
  items: z.array(z.object({
    dishId: z.number().int().positive(),
    variantId: z.number().int().positive().nullable().optional(),
    quantity: z.number().int().min(1).max(MAX_QUANTITY),
  })).max(100),
});

export type QuoteResult = Quote & {
  restaurant: { name: string; deliveryEnabled: boolean; takeawayEnabled: boolean; deliveryFee: number; minimumOrder: number } | null;
};

/** Authoritative price for the current cart. */
export async function quoteCart(input: z.input<typeof cartSchema>): Promise<QuoteResult> {
  const parsed = cartSchema.safeParse(input);
  const empty = { lines: [], subtotal: 0, discount: 0, deliveryFee: 0, total: 0, restaurant: null };
  if (!parsed.success) return { ...empty, errors: ['Panier invalide.'] };
  const ctx = await pricingContext(parsed.data.restaurantId);
  if (!ctx) return { ...empty, errors: ["Ce restaurant n'accepte pas de commandes pour le moment."] };
  const { name, deliveryEnabled, takeawayEnabled, deliveryFee, minimumOrder } = ctx.restaurant;
  return {
    ...computeQuote({ ...ctx, ...parsed.data }),
    restaurant: { name, deliveryEnabled, takeawayEnabled, deliveryFee, minimumOrder },
  };
}

const phoneRe = /^\+?[0-9][0-9 .-]{6,18}[0-9]$/;

const checkoutSchema = cartSchema.extend({
  customerName: z.string().trim().min(2, 'Indiquez votre nom.').max(120),
  customerPhone: z.string().trim().regex(phoneRe, 'Numéro de téléphone invalide.'),
  customerEmail: z.union([z.literal(''), z.email('Adresse email invalide.')]),
  address: z.string().trim().max(500),
  notes: z.string().trim().max(500),
});

export type PlaceOrderResult = { ok: true; token: string; id: number } | { ok: false; errors: string[] };

export async function placeOrder(input: z.input<typeof checkoutSchema>): Promise<PlaceOrderResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: parsed.error.issues.map((i) => i.message) };
  const data = parsed.data;
  if (data.mode === 'DELIVERY' && data.address.length < 5) return { ok: false, errors: ['Indiquez votre adresse de livraison.'] };

  const ctx = await pricingContext(data.restaurantId);
  if (!ctx) return { ok: false, errors: ["Ce restaurant n'accepte pas de commandes pour le moment."] };
  const quote = computeQuote({ ...ctx, items: data.items, mode: data.mode });
  if (quote.errors.length) return { ok: false, errors: quote.errors };

  const user = await getCurrentUser();
  const token = newToken(18);
  const order = await db.order.create({
    data: {
      token,
      restaurantId: data.restaurantId,
      userId: user?.id ?? null,
      customerName: data.customerName,
      customerPhone: data.customerPhone.replace(/[ .-]/g, ''),
      customerEmail: data.customerEmail,
      mode: data.mode,
      address: data.mode === 'DELIVERY' ? data.address : '',
      notes: data.notes,
      subtotal: quote.subtotal,
      discount: quote.discount,
      deliveryFee: quote.deliveryFee,
      total: quote.total,
      odooSyncStatus: odooConfig() ? 'PENDING' : 'DISABLED',
      items: { create: quote.lines },
      events: { create: { status: 'PENDING' } },
    },
  });

  // Push to Odoo after the response is sent, so the customer never waits on it.
  if (odooConfig()) after(() => pushOrderToOdoo(order.id));
  revalidatePath('/admin', 'layout');
  return { ok: true, token, id: order.id };
}

export async function cancelOrderByToken(token: string): Promise<{ ok: boolean; error?: string }> {
  const order = await db.order.findUnique({ where: { token } });
  if (!order) return { ok: false, error: 'Commande introuvable.' };
  if (!customerCanCancel(order.status)) return { ok: false, error: 'Le restaurant a déjà pris en charge votre commande : appelez-le pour l’annuler.' };
  await db.order.update({
    where: { id: order.id },
    data: { status: 'CANCELLED', events: { create: { status: 'CANCELLED', note: 'Annulée par le client' } } },
  });
  after(() => cancelOrderInOdoo(order.id));
  revalidatePath(`/suivi/${token}`);
  return { ok: true };
}

/** Finds an order from its number + the phone used, for customers who lost the link. */
export async function findOrder(_prev: { error?: string } | undefined, form: FormData): Promise<{ error?: string; token?: string }> {
  const id = Number(String(form.get('number') ?? '').replace(/\D/g, ''));
  const phone = String(form.get('phone') ?? '').replace(/[ .-]/g, '');
  if (!id || phone.length < 8) return { error: 'Indiquez le numéro de commande et votre téléphone.' };
  const order = await db.order.findFirst({ where: { id, customerPhone: { endsWith: phone.slice(-8) } }, select: { token: true } });
  if (!order) return { error: 'Aucune commande ne correspond à ces informations.' };
  return { token: order.token };
}
