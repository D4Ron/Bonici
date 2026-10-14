import type { Metadata } from 'next';
import Link from 'next/link';
import type { OrderStatus, Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireStaff } from '@/lib/auth';
import { restaurantScope } from '@/lib/permissions';
import { formatDateTime, formatPrice } from '@/lib/format';
import { statusLabel } from '@/lib/order-status';
import { Flash, PageHeader, type SearchParams } from '../_components/ui';
import { AutoRefresh } from '../_components/AutoRefresh';
import { Icon } from '@/components/Icon';

export const metadata: Metadata = { title: 'Commandes' };
export const dynamic = 'force-dynamic';

const VIEWS: { key: string; label: string; statuses?: OrderStatus[] }[] = [
  { key: 'en-cours', label: 'En cours', statuses: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'] },
  { key: 'attente', label: 'À accepter', statuses: ['PENDING'] },
  { key: 'terminees', label: 'Terminées', statuses: ['COMPLETED'] },
  { key: 'annulees', label: 'Annulées / refusées', statuses: ['CANCELLED', 'REJECTED'] },
  { key: 'toutes', label: 'Toutes' },
];

export default async function OrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const user = await requireStaff();
  const scope = restaurantScope(user);
  const view = VIEWS.find((v) => v.key === sp.vue) ?? VIEWS[0];
  const restaurantFilter = scope ?? (sp.restaurant ? Number(sp.restaurant) : undefined);

  const where: Prisma.OrderWhereInput = {
    ...(view.statuses && { status: { in: view.statuses } }),
    ...(restaurantFilter !== undefined && { restaurantId: restaurantFilter }),
  };
  const [orders, restaurants] = await Promise.all([
    db.order.findMany({ where, include: { restaurant: { select: { name: true } }, _count: { select: { items: true } } }, orderBy: { createdAt: 'desc' }, take: 200 }),
    scope === undefined ? db.restaurant.findMany({ orderBy: { position: 'asc' }, select: { id: true, name: true } }) : [],
  ]);

  const href = (params: Record<string, string | undefined>) => {
    const q = new URLSearchParams(Object.entries({ vue: view.key, restaurant: sp.restaurant, ...params }).filter(([, v]) => v) as [string, string][]);
    return `/admin/commandes?${q}`;
  };

  return (
    <>
      <PageHeader title="Commandes" sub={`${orders.length} commande(s)`} action={<AutoRefresh />} />
      <Flash sp={sp} />

      <div className="filters">
        {VIEWS.map((v) => <Link key={v.key} href={href({ vue: v.key })} className={v.key === view.key ? 'active' : undefined}>{v.label}</Link>)}
      </div>
      {restaurants.length > 1 && (
        <div className="filters">
          <Link href={href({ restaurant: undefined })} className={!sp.restaurant ? 'active' : undefined}>Tous les restaurants</Link>
          {restaurants.map((r) => <Link key={r.id} href={href({ restaurant: String(r.id) })} className={sp.restaurant === String(r.id) ? 'active' : undefined}>{r.name}</Link>)}
        </div>
      )}

      <div className="table-wrapper">
        <table>
          <thead><tr><th>N°</th><th>Reçue</th><th>Client</th><th>Restaurant</th><th>Mode</th><th>Total</th><th>Statut</th><th>Odoo</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td><Link href={`/admin/commandes/${o.id}`}>#{o.id}</Link></td>
                <td>{formatDateTime(o.createdAt)}</td>
                <td>{o.customerName}<br /><span className="muted">{o.customerPhone}</span></td>
                <td>{o.restaurant.name}</td>
                <td>{o.mode === 'DELIVERY' ? <><Icon name="truck" size={14} /> Livraison</> : <><Icon name="bag" size={14} /> À emporter</>}</td>
                <td>{formatPrice(o.total)}<br /><span className="muted">{o._count.items} article(s)</span></td>
                <td><span className={`badge badge-${o.status}`}>{statusLabel(o.status, o.mode)}</span></td>
                <td><span className={`badge badge-${o.odooSyncStatus === 'PENDING' ? 'PENDINGSYNC' : o.odooSyncStatus}`}>{o.odooOrderName || o.odooSyncStatus.toLowerCase()}</span></td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={8} className="empty">Aucune commande.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
