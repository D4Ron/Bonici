import Link from 'next/link';
import { db } from '@/lib/db';
import { requireStaff } from '@/lib/auth';
import { restaurantScope } from '@/lib/permissions';
import { formatDateTime, formatPrice } from '@/lib/format';
import { statusLabel } from '@/lib/order-status';
import { PageHeader } from './_components/ui';
import { AutoRefresh } from './_components/AutoRefresh';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await requireStaff();
  const scope = restaurantScope(user);
  const where = scope !== undefined ? { restaurantId: scope } : {};
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0); // Lomé is UTC+0
  const weekAgo = new Date(startOfDay.getTime() - 6 * 86_400_000);
  const counted = { status: { notIn: ['CANCELLED', 'REJECTED'] as ('CANCELLED' | 'REJECTED')[] } };

  const [today, pending, inProgress, revenueToday, week, recent, top] = await Promise.all([
    db.order.count({ where: { ...where, ...counted, createdAt: { gte: startOfDay } } }),
    db.order.count({ where: { ...where, status: 'PENDING' } }),
    db.order.count({ where: { ...where, status: { in: ['CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'] } } }),
    db.order.aggregate({ where: { ...where, ...counted, createdAt: { gte: startOfDay } }, _sum: { total: true } }),
    db.order.findMany({ where: { ...where, ...counted, createdAt: { gte: weekAgo } }, select: { createdAt: true, total: true } }),
    db.order.findMany({ where, include: { restaurant: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, take: 8 }),
    db.orderItem.groupBy({
      by: ['name'],
      where: { order: { ...where, ...counted, createdAt: { gte: new Date(Date.now() - 30 * 86_400_000) } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
  ]);

  const days = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekAgo.getTime() + i * 86_400_000);
    const key = day.toISOString().slice(0, 10);
    const rows = week.filter((o) => o.createdAt.toISOString().slice(0, 10) === key);
    return { label: day.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }), count: rows.length, total: rows.reduce((s, o) => s + o.total, 0) };
  });
  const maxTotal = Math.max(1, ...days.map((d) => d.total));

  return (
    <>
      <PageHeader title="Tableau de bord" sub={formatDateTime(new Date())} action={<AutoRefresh seconds={30} />} />

      <div className="kpi-grid">
        <Link href="/admin/commandes?vue=attente" className="kpi" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="label">À accepter</div><div className="value">{pending}</div>
        </Link>
        <div className="kpi"><div className="label">En cours</div><div className="value">{inProgress}</div></div>
        <div className="kpi"><div className="label">Commandes aujourd&apos;hui</div><div className="value">{today}</div></div>
        <div className="kpi"><div className="label">CA aujourd&apos;hui</div><div className="value">{formatPrice(revenueToday._sum.total ?? 0)}</div></div>
      </div>

      <div className="order-detail-grid">
        <div className="card">
          <h2>7 derniers jours</h2>
          <table>
            <tbody>
              {days.map((d) => (
                <tr key={d.label}>
                  <td style={{ width: 90 }}>{d.label}</td>
                  <td>
                    <div style={{ background: '#fde7eb', borderRadius: 6, height: 10, width: '100%' }}>
                      <div style={{ background: '#C3102F', borderRadius: 6, height: 10, width: `${(d.total / maxTotal) * 100}%`, transition: 'width .6s' }} />
                    </div>
                  </td>
                  <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>{d.count} cmd · {formatPrice(d.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2>Plats les plus commandés (30 j)</h2>
          {top.length === 0 ? <p className="muted">Pas encore de commandes.</p> : (
            <table><tbody>{top.map((t, i) => <tr key={t.name}><td>{i + 1}. {t.name}</td><td style={{ textAlign: 'right' }}>{t._sum.quantity}</td></tr>)}</tbody></table>
          )}
        </div>
      </div>

      <div className="card">
        <h2>Dernières commandes</h2>
        {recent.length === 0 ? <p className="muted">Aucune commande pour l&apos;instant.</p> : (
          <table>
            <thead><tr><th>N°</th><th>Client</th><th>Restaurant</th><th>Total</th><th>Statut</th><th>Reçue</th></tr></thead>
            <tbody>
              {recent.map((o) => (
                <tr key={o.id}>
                  <td><Link href={`/admin/commandes/${o.id}`}>#{o.id}</Link></td>
                  <td>{o.customerName}</td>
                  <td>{o.restaurant.name}</td>
                  <td>{formatPrice(o.total)}</td>
                  <td><span className={`badge badge-${o.status}`}>{statusLabel(o.status, o.mode)}</span></td>
                  <td>{formatDateTime(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
