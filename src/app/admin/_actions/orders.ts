'use server';

import { after } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireAdmin, requireStaff } from '@/lib/auth';
import { canManageRestaurant } from '@/lib/permissions';
import { canTransition, type OrderStatus } from '@/lib/order-status';
import { cancelOrderInOdoo, pushOrderToOdoo, syncPendingOrders } from '@/lib/odoo';
import { fail, handle, str } from '../_lib/form';

const STATUSES: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED', 'REJECTED'];

export async function changeOrderStatus(orderId: number, form: FormData) {
  const back = `/admin/commandes/${orderId}`;
  await handle(back, async () => {
    const user = await requireStaff();
    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order || !canManageRestaurant(user, order.restaurantId)) fail('Commande introuvable.');

    const to = str(form, 'status') as OrderStatus;
    if (!STATUSES.includes(to) || !canTransition(order.status, to, order.mode)) fail('Ce changement de statut n’est pas possible.');
    const note = str(form, 'note').slice(0, 500);

    await db.order.update({
      where: { id: order.id },
      data: {
        status: to,
        ...(to === 'COMPLETED' && { paymentStatus: 'PAID' }), // cash collected on delivery/pick-up
        events: { create: { status: to, note } },
      },
    });
    if (to === 'CANCELLED' || to === 'REJECTED') after(() => cancelOrderInOdoo(order.id));
    revalidatePath('/admin', 'layout');
    revalidatePath(`/suivi/${order.token}`);
  }, 'Statut mis à jour.');
}

export async function retryOdoo(orderId: number) {
  await handle(`/admin/commandes/${orderId}`, async () => {
    const user = await requireStaff();
    const order = await db.order.findUnique({ where: { id: orderId }, select: { restaurantId: true } });
    if (!order || !canManageRestaurant(user, order.restaurantId)) fail('Commande introuvable.');
    await pushOrderToOdoo(orderId);
    const after = await db.order.findUnique({ where: { id: orderId }, select: { odooSyncStatus: true, odooError: true } });
    if (after?.odooSyncStatus === 'FAILED') fail(`Odoo : ${after.odooError}`);
  }, 'Commande envoyée à Odoo.');
}

export async function syncAllToOdoo() {
  await handle('/admin/odoo', async () => {
    await requireAdmin();
    const { attempted, synced } = await syncPendingOrders();
    if (attempted > synced) fail(`${synced}/${attempted} commandes synchronisées. Voir les erreurs sur chaque commande.`);
  }, 'Toutes les commandes en attente ont été envoyées à Odoo.');
}
