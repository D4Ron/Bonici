// Odoo integration: website orders are pushed to Odoo as sales orders (sale.order).
//
// Uses Odoo's external JSON-RPC API (/jsonrpc + execute_kw), available on Odoo
// 14 → 19, Community and Enterprise, self-hosted and Odoo Online (paid plans).
// The integration is one-way and optional: with ODOO_URL unset, orders are simply
// marked DISABLED. Failed pushes are kept as FAILED and can be retried from the
// admin or with `npm run odoo:sync`. Retries never create duplicates: the sales
// order carries client_order_ref = "WEB-<order id>" and is looked up first.
import { db } from './db';

interface OdooConfig {
  url: string;
  db: string;
  username: string;
  apiKey: string;
  fallbackProductId: number | null;
  deliveryProductId: number | null;
  confirmOrders: boolean;
  lineTaxIds: number[];
}

export function odooConfig(): OdooConfig | null {
  const { ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_API_KEY } = process.env;
  if (!ODOO_URL || !ODOO_DB || !ODOO_USERNAME || !ODOO_API_KEY) return null;
  const num = (v?: string) => (v && Number.isInteger(Number(v)) ? Number(v) : null);
  return {
    url: ODOO_URL.replace(/\/$/, ''),
    db: ODOO_DB,
    username: ODOO_USERNAME,
    apiKey: ODOO_API_KEY,
    fallbackProductId: num(process.env.ODOO_FALLBACK_PRODUCT_ID),
    deliveryProductId: num(process.env.ODOO_DELIVERY_PRODUCT_ID),
    confirmOrders: process.env.ODOO_CONFIRM_ORDERS !== 'false',
    lineTaxIds: (process.env.ODOO_LINE_TAX_IDS ?? '').split(',').map(Number).filter((n) => Number.isInteger(n) && n > 0),
  };
}

export class OdooClient {
  private uid: number | null = null;
  constructor(private cfg: OdooConfig) {}

  private async rpc<T>(service: string, method: string, args: unknown[]): Promise<T> {
    const res = await fetch(`${this.cfg.url}/jsonrpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: { service, method, args }, id: Date.now() }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`Odoo HTTP ${res.status}`);
    const body = (await res.json()) as { result?: T; error?: { message: string; data?: { message?: string } } };
    if (body.error) throw new Error(body.error.data?.message || body.error.message);
    return body.result as T;
  }

  async login(): Promise<number> {
    if (this.uid) return this.uid;
    const uid = await this.rpc<number | false>('common', 'authenticate', [this.cfg.db, this.cfg.username, this.cfg.apiKey, {}]);
    if (!uid) throw new Error('Identifiants Odoo refusés');
    this.uid = uid;
    return uid;
  }

  async call<T>(model: string, method: string, args: unknown[], kwargs: Record<string, unknown> = {}): Promise<T> {
    const uid = await this.login();
    return this.rpc<T>('object', 'execute_kw', [this.cfg.db, uid, this.cfg.apiKey, model, method, args, kwargs]);
  }

  private taxField: string | null = null;

  /** The order-line taxes field: `tax_id` up to Odoo 18, `tax_ids` from Odoo 19. */
  async lineTaxField(): Promise<string> {
    if (!this.taxField) {
      const fields = await this.call<Record<string, unknown>>('sale.order.line', 'fields_get', [['tax_id', 'tax_ids']], { attributes: ['type'] });
      this.taxField = 'tax_ids' in fields ? 'tax_ids' : 'tax_id';
    }
    return this.taxField;
  }

  async version(): Promise<string> {
    const v = await this.rpc<{ server_version: string }>('common', 'version', []);
    return v.server_version;
  }
}

const orderRef = (id: number) => `WEB-${id}`;

/** Pushes one website order to Odoo and records the outcome on the order. */
export async function pushOrderToOdoo(orderId: number): Promise<void> {
  const cfg = odooConfig();
  if (!cfg) {
    await db.order.update({ where: { id: orderId }, data: { odooSyncStatus: 'DISABLED' } });
    return;
  }
  const order = await db.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: { include: { dish: { select: { odooProductId: true } } } }, restaurant: true },
  });
  if (order.odooSyncStatus === 'SYNCED') return;

  try {
    const odoo = new OdooClient(cfg);

    const existing = await odoo.call<{ id: number; name: string }[]>('sale.order', 'search_read',
      [[['client_order_ref', '=', orderRef(order.id)]]], { fields: ['name'], limit: 1 });

    let saleId: number;
    let saleName: string;
    if (existing.length) {
      ({ id: saleId, name: saleName } = existing[0]);
    } else {
      const partnerId = await findOrCreatePartner(odoo, order);
      // Site prices already include tax. Without this, Odoo applies the product's default sales
      // tax on top (e.g. +18 % VAT in Togo) and its total no longer matches what the customer paid.
      // ODOO_LINE_TAX_IDS can name price-included taxes to keep VAT reporting right.
      const taxes = { [await odoo.lineTaxField()]: [[6, 0, cfg.lineTaxIds]] };
      const lines = order.items.map((item) => {
        const productId = item.dish?.odooProductId ?? cfg.fallbackProductId;
        if (!productId) throw new Error(`Aucun produit Odoo pour « ${item.name} » (renseignez l'ID produit du plat ou ODOO_FALLBACK_PRODUCT_ID)`);
        return [0, 0, {
          product_id: productId,
          name: item.name,
          product_uom_qty: item.quantity,
          price_unit: item.basePrice,
          discount: item.discountPercent,
          ...taxes,
        }];
      });
      if (order.deliveryFee > 0) {
        const productId = cfg.deliveryProductId ?? cfg.fallbackProductId;
        if (!productId) throw new Error('Aucun produit Odoo pour les frais de livraison (ODOO_DELIVERY_PRODUCT_ID)');
        lines.push([0, 0, { product_id: productId, name: 'Frais de livraison', product_uom_qty: 1, price_unit: order.deliveryFee, discount: 0, ...taxes }]);
      }

      const noteParts = [
        `Commande site web #${order.id} — ${order.restaurant.name}`,
        order.mode === 'DELIVERY' ? `Livraison : ${order.address}` : 'À emporter',
        `Paiement : espèces`,
        order.notes && `Note client : ${order.notes}`,
      ].filter(Boolean);

      const values: Record<string, unknown> = {
        partner_id: partnerId,
        client_order_ref: orderRef(order.id),
        origin: `Site web #${order.id}`,
        note: noteParts.join('\n'),
        order_line: lines,
      };
      if (order.restaurant.odooWarehouseId) values.warehouse_id = order.restaurant.odooWarehouseId;

      saleId = await odoo.call<number>('sale.order', 'create', [values]);
      const [created] = await odoo.call<{ amount_total: number }[]>('sale.order', 'read', [[saleId]], { fields: ['amount_total'] });
      if (created && Math.round(created.amount_total) !== order.total) {
        await odoo.call('sale.order', 'unlink', [[saleId]]); // still a quotation: remove it so a retry starts clean
        throw new Error(`Total Odoo (${created.amount_total}) ≠ total site (${order.total}) : vérifiez ODOO_LINE_TAX_IDS (taxes incluses dans le prix).`);
      }
      if (cfg.confirmOrders) await odoo.call('sale.order', 'action_confirm', [[saleId]]);
      const [read] = await odoo.call<{ name: string }[]>('sale.order', 'read', [[saleId]], { fields: ['name'] });
      saleName = read?.name ?? '';
    }

    await db.order.update({
      where: { id: order.id },
      data: { odooSyncStatus: 'SYNCED', odooOrderId: saleId, odooOrderName: saleName, odooError: '' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[odoo] order ${order.id} not synced: ${message}`);
    await db.order.update({ where: { id: order.id }, data: { odooSyncStatus: 'FAILED', odooError: message.slice(0, 1000) } });
  }
}

async function findOrCreatePartner(odoo: OdooClient, order: { customerName: string; customerPhone: string; customerEmail: string; address: string }) {
  const found = await odoo.call<number[]>('res.partner', 'search', [[['phone', '=', order.customerPhone]]], { limit: 1 });
  if (found.length) return found[0];
  return odoo.call<number>('res.partner', 'create', [{
    name: order.customerName,
    phone: order.customerPhone,
    email: order.customerEmail || false,
    street: order.address || false,
    comment: 'Client créé depuis le site web Bonici',
  }]);
}

/** Best effort: cancels the matching Odoo sales order when the website order is cancelled. */
export async function cancelOrderInOdoo(orderId: number): Promise<void> {
  const cfg = odooConfig();
  if (!cfg) return;
  const order = await db.order.findUnique({ where: { id: orderId }, select: { odooOrderId: true } });
  if (!order?.odooOrderId) return;
  try {
    // Without this context flag, Odoo 17+ answers with a confirmation wizard instead of cancelling.
    await new OdooClient(cfg).call('sale.order', 'action_cancel', [[order.odooOrderId]], { context: { disable_cancel_warning: true } });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db.order.update({ where: { id: orderId }, data: { odooError: `Annulation non répercutée dans Odoo : ${message}`.slice(0, 1000) } });
  }
}

/** Retries every order that isn't in Odoo yet. Used by the admin button and `npm run odoo:sync`. */
export async function syncPendingOrders(): Promise<{ attempted: number; synced: number }> {
  if (!odooConfig()) return { attempted: 0, synced: 0 };
  const pending = await db.order.findMany({
    where: { odooSyncStatus: { in: ['PENDING', 'FAILED', 'DISABLED'] }, status: { notIn: ['CANCELLED', 'REJECTED'] } },
    select: { id: true },
    orderBy: { id: 'asc' },
    take: 200,
  });
  for (const { id } of pending) await pushOrderToOdoo(id);
  const synced = await db.order.count({ where: { id: { in: pending.map((p) => p.id) }, odooSyncStatus: 'SYNCED' } });
  return { attempted: pending.length, synced };
}
