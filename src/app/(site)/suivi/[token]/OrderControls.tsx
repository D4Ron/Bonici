'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { cancelOrderByToken } from '@/app/actions/orders';
import { Icon } from '@/components/Icon';

const REFRESH_MS = 15_000;

/** Re-renders the page from the server every 15 s while the order is in progress. */
export function LiveRefresh() {
  const router = useRouter();
  const [pending, start] = useTransition();
  useEffect(() => {
    const t = setInterval(() => document.visibilityState === 'visible' && router.refresh(), REFRESH_MS);
    return () => clearInterval(t);
  }, [router]);
  return (
    <button className="btn-refresh" onClick={() => start(() => router.refresh())} disabled={pending}>
      <Icon name="refresh" size={16} /> {pending ? 'Mise à jour…' : 'Actualiser'}
    </button>
  );
}

export function CancelButton({ token }: { token: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState('');
  return (
    <>
      <button
        className="btn-cancel"
        disabled={pending}
        onClick={() => {
          if (!confirm('Annuler cette commande ?')) return;
          start(async () => {
            const res = await cancelOrderByToken(token);
            if (!res.ok) setError(res.error ?? 'Annulation impossible.');
            router.refresh();
          });
        }}
      >
        {pending ? 'Annulation…' : 'Annuler la commande'}
      </button>
      {error && <p className="error">{error}</p>}
    </>
  );
}
