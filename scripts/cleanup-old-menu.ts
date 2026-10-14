// One-off (October 2026): removes the placeholder menu and the four provisional branches from a
// development database, so `npm run db:seed` can load Bonici's real menu and seven branches.
// Not needed on a fresh database. Usage: npx tsx --env-file-if-exists=.env scripts/cleanup-old-menu.ts
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();
const OLD_BRANCHES = ['kanyikope', 'agoe-2-lions', 'nyekonakpoe']; // aneho keeps its slug

async function main() {
  const old = await db.restaurant.findMany({ where: { slug: { in: OLD_BRANCHES } }, select: { id: true } });
  const oldIds = old.map((r) => r.id);
  const result = await db.$transaction([
    // Test orders placed on the provisional branches/dishes during development.
    db.order.deleteMany({ where: { restaurantId: { in: oldIds } } }),
    db.promotion.deleteMany({}),
    db.menuItem.deleteMany({}),
    db.dish.deleteMany({}),
    db.category.deleteMany({}),
    // The seed already re-created these reviews on the new branches.
    db.review.deleteMany({ where: { restaurantId: { in: oldIds } } }),
    db.user.updateMany({ where: { restaurantId: { in: oldIds } }, data: { restaurantId: null } }),
    db.restaurant.deleteMany({ where: { id: { in: oldIds } } }),
  ]);
  console.log({ orders: result[0].count, dishes: result[3].count, categories: result[4].count, branches: result[7].count });
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => db.$disconnect());
