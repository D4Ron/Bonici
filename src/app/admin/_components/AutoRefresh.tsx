'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** Refreshes server data periodically so new orders appear without reloading. */
export function AutoRefresh({ seconds = 20 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => document.visibilityState === 'visible' && router.refresh(), seconds * 1000);
    return () => clearInterval(t);
  }, [router, seconds]);
  return <span className="muted" style={{ fontSize: '0.8rem' }}>Actualisation automatique toutes les {seconds} s</span>;
}
