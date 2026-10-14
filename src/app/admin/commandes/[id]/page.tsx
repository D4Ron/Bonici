import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requireStaff } from '@/lib/auth';
import { canManageRestaurant } from '@/lib/permissions';
import { formatDateTime, formatPrice } from '@/lib/format';
import { actionLabel, nextStatuses, statusLabel } from '@/lib/order-status';
import { odooConfig } from '@/lib/odoo';
import { changeOrderStatus, retryOdoo } from '../../_actions/orders';
import { Flash, PageHeader, type SearchParams } from '../../_components/ui';
import { ConfirmButton } from '../../_components/ConfirmButton';
import { AutoRefresh } from '../../_components/AutoRefresh';
import { Icon } from '@/components/Icon';

export const dynamic = 'force-dynamic';

export default async function OrderDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SearchParams }) {
  const [{ id }, sp, user] = await Promise.all([params, searchParams, requireStaff()]);
  const order = await db.order.findUnique({
    where: { id: Number(id) || 0 },
    include: { restaurant: true, items: true, events: { orderBy: { createdAt: 'asc' } }, user: { select: { email: true } } },
  });
  if (!order || !canManageRestaurant(user, order.restaurantId)) notFound();

  const next = nextStatuses(order.status, order.mode);
  const odooOn = !!odooConfig();

  return (
    <>
      <PageHeader
        title={`Commande #${order.id}`}
        sub={`${order.restaurant.name} · reçue le ${formatDateTime(order.createdAt)}`}
        action={<Link href="/admin/commandes" className="btn-ghost"><Icon name="arrowLeft" size={14} /> Toutes les commandes</Link>}
      />
      <Flash sp={sp} />

      <div className="order-detail-grid">
        <div>
          <div className="card">
            <h2>Statut : <span className={`badge badge-${order.status}`}>{statusLabel(order.status, order.mode)}</span></h2>
            {next.length > 0 ? (
              <>
                <div className="status-actions">
                  {next.map((to) => {
                    const destructive = to === 'CANCELLED' || to === 'REJECTED';
                    return (
                      <form key={to} action={changeOrderStatus.bind(null, order.id)} className="inline-form">
                        <input type="hidden" name="status" value={to} />
                        {destructive ? (
                          <>
                            <input name="note" placeholder="Motif (montré au client)" className="small" style={{ width: 200, marginRight: 6 }} />
                            <ConfirmButton message={`${actionLabel(to, order.mode)} la commande #${order.id} ?`}>{actionLabel(to, order.mode)}</ConfirmButton>
                          </>
                        ) : (
                          <button className="btn-save">{actionLabel(to, order.mode)}</button>
                        )}
                      </form>
                    );
                  })}
                </div>
                <div style={{ marginTop: 12 }}><AutoRefresh seconds={30} /></div>
              </>
            ) : <p className="muted">Commande terminée.</p>}
          </div>

          <div className="card">
            <h2>Articles</h2>
            <table>
              <thead><tr><th>Plat</th><th>Qté</th><th>Prix unitaire</th><th>Total</th></tr></thead>
              <tbody>
                {order.items.map((it) => (
                  <tr key={it.id}>
                    <td>{it.name}{it.discountPercent > 0 && <span className="muted"> (-{it.discountPercent}%)</span>}</td>
                    <td>{it.quantity}</td>
                    <td>{formatPrice(it.unitPrice)}</td>
                    <td>{formatPrice(it.lineTotal)}</td>
                  </tr>
                ))}
                {order.discount > 0 && <tr><td colSpan={3}>Promotions</td><td>-{formatPrice(order.discount)}</td></tr>}
                {order.deliveryFee > 0 && <tr><td colSpan={3}>Frais de livraison</td><td>{formatPrice(order.deliveryFee)}</td></tr>}
                <tr><td colSpan={3}><strong>Total à encaisser (espèces)</strong></td><td><strong>{formatPrice(order.total)}</strong></td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="card">
            <h2>Client</h2>
            <dl>
              <dt>Nom</dt><dd>{order.customerName}</dd>
              <dt>Téléphone</dt><dd><a href={`tel:${order.customerPhone}`}>{order.customerPhone}</a></dd>
              {order.customerEmail && <><dt>Email</dt><dd>{order.customerEmail}</dd></>}
              <dt>Mode</dt><dd>{order.mode === 'DELIVERY' ? 'Livraison' : 'À emporter'}</dd>
              {order.mode === 'DELIVERY' && <><dt>Adresse</dt><dd>{order.address}</dd></>}
              {order.notes && <><dt>Instructions</dt><dd>{order.notes}</dd></>}
              <dt>Compte</dt><dd>{order.user?.email ?? 'Invité'}</dd>
              <dt>Paiement</dt><dd>Espèces · {order.paymentStatus === 'PAID' ? 'encaissé' : 'à encaisser'}</dd>
            </dl>
          </div>

          <div className="card">
            <h2>Historique</h2>
            <ul className="timeline">
              {order.events.map((e) => (
                <li key={e.id}>
                  <span>{statusLabel(e.status, order.mode)}{e.note && <span className="muted"> — {e.note}</span>}</span>
                  <span className="muted">{formatDateTime(e.createdAt)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card">
            <h2>Odoo</h2>
            {order.odooSyncStatus === 'SYNCED' ? (
              <p><Icon name="checkCircle" size={16} style={{ color: '#1e8449' }} /> Bon de commande <strong>{order.odooOrderName}</strong> (id {order.odooOrderId})</p>
            ) : (
              <p className="muted">{order.odooSyncStatus === 'DISABLED' ? 'Intégration Odoo non configurée lors de la commande.' : order.odooSyncStatus === 'PENDING' ? 'Envoi en cours…' : 'Envoi échoué.'}</p>
            )}
            {order.odooError && <p className="alert-error" style={{ marginTop: 8 }}>{order.odooError}</p>}
            {odooOn && order.odooSyncStatus !== 'SYNCED' && (
              <form action={retryOdoo.bind(null, order.id)}><button className="btn-ghost">Envoyer à Odoo</button></form>
            )}
          </div>

          <p className="muted">Lien de suivi client : <Link href={`/suivi/${order.token}`} target="_blank">/suivi/{order.token.slice(0, 8)}…</Link></p>
        </div>
      </div>
    </>
  );
}
