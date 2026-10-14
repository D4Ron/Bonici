import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { logout } from '@/app/actions/auth';
import { formatDateTime, formatPrice } from '@/lib/format';
import { statusLabel } from '@/lib/order-status';

export const metadata: Metadata = { title: 'Mon compte' };

export default async function AccountPage() {
  const user = await requireUser('/compte');
  if (user.role !== 'CUSTOMER') redirect('/admin');
  const orders = await db.order.findMany({
    where: { userId: user.id },
    include: { restaurant: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div className="content-page">
      <div className="inner">
        <h1 className="reveal">Bonjour <em>{user.name}</em></h1>
        <p className="lead reveal">{user.email}{user.phone && ` · ${user.phone}`}</p>

        <div className="card reveal">
          <h3>Mes commandes</h3>
          {orders.length === 0 ? (
            <p>Aucune commande pour l&apos;instant. <Link href="/menus" style={{ color: '#C3102F', fontWeight: 600 }}>Voir les menus</Link></p>
          ) : (
            <table className="orders-table">
              <thead><tr><th>N°</th><th>Restaurant</th><th>Date</th><th>Total</th><th>Statut</th></tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td><Link href={`/suivi/${o.token}`}>#{o.id}</Link></td>
                    <td>{o.restaurant.name}</td>
                    <td>{formatDateTime(o.createdAt)}</td>
                    <td>{formatPrice(o.total)}</td>
                    <td>{statusLabel(o.status, o.mode)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <form action={logout}><button className="btn-link">Se déconnecter</button></form>
      </div>
    </div>
  );
}
