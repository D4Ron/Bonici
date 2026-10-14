import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { formatDateTime, formatPrice } from '@/lib/format';
import { customerCanCancel, isFinal, statusLabel, trackingSteps } from '@/lib/order-status';
import { LiveRefresh, CancelButton } from './OrderControls';
import { Icon } from '@/components/Icon';

export const metadata: Metadata = { title: 'Suivi de commande', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function OrderTrackingPage({ params, searchParams }: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ nouvelle?: string }>;
}) {
  const { token } = await params;
  const { nouvelle } = await searchParams;
  const order = await db.order.findUnique({
    where: { token },
    include: { restaurant: true, items: true, events: { orderBy: { createdAt: 'asc' } } },
  });
  if (!order) notFound();

  const steps = trackingSteps(order.mode);
  const currentIndex = steps.indexOf(order.status);
  const stopped = order.status === 'CANCELLED' || order.status === 'REJECTED';
  const reachedAt = (s: string) => order.events.find((e) => e.status === s)?.createdAt;

  return (
    <div className="s-suivi">
      <div className="suivi-page">
        <div className="suivi-hero">
          <h1>Commande <em>#{order.id}</em></h1>
          <p>{order.restaurant.name} · passée le {formatDateTime(order.createdAt)}</p>
        </div>

        <div className="suivi-body">
          {nouvelle && (
            <div className="alert-success reveal">
              <Icon name="checkCircle" size={18} /> Merci ! Votre commande a bien été envoyée au restaurant. Gardez cette page : son lien permet de suivre votre commande
              (elle est aussi mémorisée sur cet appareil, dans « Suivi »). Numéro de commande : <strong>#{order.id}</strong>.
            </div>
          )}

          <div className="detail-actions">
            <Link className="back-btn" href="/suivi"><Icon name="arrowLeft" size={14} /> Suivi</Link>
            {!isFinal(order.status) && <LiveRefresh />}
          </div>

          <div className="order-detail">
            <div className="detail-header">
              <h2>Commande #{order.id}</h2>
              <div className={`badge badge-${order.status.toLowerCase()}`}>{statusLabel(order.status, order.mode)}</div>
            </div>
            <p className="resto">{order.restaurant.name} · {order.mode === 'DELIVERY' ? 'Livraison' : 'À emporter'}</p>

            {stopped ? (
              <div className="stopped">
                {order.status === 'CANCELLED' ? 'Cette commande a été annulée.' : "Le restaurant n'a pas pu accepter cette commande."}
                {order.events.at(-1)?.note && <div style={{ fontWeight: 400, marginTop: 4 }}>{order.events.at(-1)!.note}</div>}
              </div>
            ) : (
              <div className="progress-steps">
                {steps.map((s, i) => (
                  <div className={`step${i < currentIndex || order.status === 'COMPLETED' ? ' completed' : ''}${i === currentIndex && order.status !== 'COMPLETED' ? ' current' : ''}`} key={s}>
                    <div className="step-icon">{i <= currentIndex && <Icon name="check" size={16} />}</div>
                    <div className="step-label">
                      {statusLabel(s, order.mode)}
                      {reachedAt(s) && <><br /><small>{formatDateTime(reachedAt(s)!).split(' ')[1]}</small></>}
                    </div>
                    {i < steps.length - 1 && <div className={`step-line${i < currentIndex ? ' line-completed' : ''}`} />}
                  </div>
                ))}
              </div>
            )}

            <div className="info-block">
              <h3>Récapitulatif</h3>
              <table className="items-table">
                <tbody>
                  {order.items.map((it) => (
                    <tr key={it.id}>
                      <td>{it.quantity} × {it.name}{it.discountPercent > 0 && <small> (-{it.discountPercent}%)</small>}</td>
                      <td>{formatPrice(it.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="totals">
                {order.discount > 0 && <p><span>Promotions</span><span>-{formatPrice(order.discount)}</span></p>}
                {order.mode === 'DELIVERY' && <p><span>Livraison</span><span>{formatPrice(order.deliveryFee)}</span></p>}
                <p className="total-price"><strong>Total à payer en espèces</strong><strong>{formatPrice(order.total)}</strong></p>
              </div>
              {order.mode === 'DELIVERY' && <p><strong>Adresse :</strong> {order.address}</p>}
              {order.notes && <p><strong>Instructions :</strong> {order.notes}</p>}
              {order.restaurant.phone && (
                <p className="contact-branch">
                  Une question ? Appelez le restaurant : <a href={`tel:+228${order.restaurant.phone.replace(/\D/g, '')}`}>{order.restaurant.phone}</a>
                </p>
              )}
            </div>

            <div className="actions">
              {customerCanCancel(order.status) && <CancelButton token={order.token} />}
              <Link href={`/menus?restaurant=${order.restaurant.slug}`} className="btn-reorder">Commander à nouveau</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
