'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { findOrder } from '@/app/actions/orders';
import { formatDateTime } from '@/lib/format';
import { readRecentOrders, type RecentOrder } from '@/lib/recent-orders';

export function OrderLookup() {
  const router = useRouter();
  const [state, action, pending] = useActionState(findOrder, undefined);

  useEffect(() => {
    if (state?.token) router.push(`/suivi/${state.token}`);
  }, [state, router]);

  return (
    <>
      <form className="order-search" action={action}>
        <input name="number" inputMode="numeric" placeholder="N° de commande (ex. 42)" required aria-label="Numéro de commande" />
        <input name="phone" type="tel" placeholder="Téléphone" required aria-label="Téléphone" />
        <button type="submit" disabled={pending}>{pending ? '…' : 'Suivre'}</button>
      </form>
      {state?.error && <p className="lookup-error" role="alert">{state.error}</p>}
    </>
  );
}

export function RecentOrders() {
  const [orders, setOrders] = useState<RecentOrder[] | null>(null);
  useEffect(() => setOrders(readRecentOrders()), []);
  if (!orders?.length) return null;

  return (
    <>
      <h2 className="recent-title">Vos commandes récentes sur cet appareil</h2>
      <div className="orders-list">
        {orders.map((o, i) => (
          <Link href={`/suivi/${o.token}`} className="order-card reveal" style={{ ['--i' as string]: i }} key={o.token}>
            <div className="card-header"><span className="order-nb">#{o.id}</span></div>
            <div className="card-body">
              <div>{o.restaurant}</div>
              <div>{formatDateTime(new Date(o.placedAt))}</div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
