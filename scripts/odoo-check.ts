// Local integration check against a test Odoo: push → verify totals → cancel → verify.
// Usage (with ODOO_* set): npx tsx --env-file-if-exists=.env scripts/odoo-check.ts <orderId>
import { cancelOrderInOdoo, odooConfig, OdooClient, pushOrderToOdoo } from '../src/lib/odoo';
import { db } from '../src/lib/db';

async function main() {
  const id = Number(process.argv[2]);
  const cfg = odooConfig();
  if (!cfg || !id) throw new Error('Set ODOO_* env vars and pass an order id.');
  const odoo = new OdooClient(cfg);

  await db.order.update({ where: { id }, data: { odooSyncStatus: 'FAILED', odooOrderId: null, odooOrderName: '', odooError: '' } });
  await pushOrderToOdoo(id);
  const order = await db.order.findUniqueOrThrow({ where: { id } });
  console.log('site:', { status: order.odooSyncStatus, name: order.odooOrderName, total: order.total, error: order.odooError || undefined });
  if (!order.odooOrderId) return;

  const read = async () => (await odoo.call<{ state: string; amount_total: number; amount_tax: number }[]>(
    'sale.order', 'read', [[order.odooOrderId]], { fields: ['state', 'amount_total', 'amount_tax'] }))[0];
  console.log('odoo after push:', await read());

  await cancelOrderInOdoo(id);
  console.log('odoo after cancel:', await read());
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => db.$disconnect());
