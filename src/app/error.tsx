'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Icon } from '@/components/Icon';

// Shown instead of Next's default English error screen (e.g. if the database is unreachable).
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="content-page" style={{ textAlign: 'center' }}>
      <div className="inner">
        <Icon name="alert" size={48} style={{ color: '#C3102F', margin: '0 auto 16px', display: 'block' }} />
        <h1>Un <em>problème</em> est survenu</h1>
        <p className="lead">La page n&apos;a pas pu se charger. Réessayez dans un instant ; si le problème continue, appelez votre restaurant Bonici.</p>
        <p style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={reset}>Réessayer</button>
          <Link href="/" className="btn-primary" style={{ background: '#1a1a1a' }}>Accueil</Link>
        </p>
        {error.digest && <p className="lead" style={{ fontSize: '0.8rem', marginTop: 24 }}>Référence : {error.digest}</p>}
      </div>
    </div>
  );
}
