// Retries pushing every unsynced website order to Odoo.
// Usage: npm run odoo:sync   (in Docker: docker compose run --rm migrate npm run odoo:sync)
import { odooConfig, OdooClient, syncPendingOrders } from '../src/lib/odoo';
import { db } from '../src/lib/db';

async function main() {
  const cfg = odooConfig();
  if (!cfg) {
    console.log('Odoo is not configured (ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_API_KEY).');
    return;
  }
  console.log(`Odoo ${await new OdooClient(cfg).version()} at ${cfg.url}`);
  const { attempted, synced } = await syncPendingOrders();
  console.log(`${synced}/${attempted} orders synced.`);
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => db.$disconnect());
