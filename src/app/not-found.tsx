import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="content-page" style={{ textAlign: 'center' }}>
      <div className="inner">
        <img src="/images/logo-bonici.png" alt="Bonici" style={{ height: 120, margin: '0 auto 16px' }} />
        <h1>Page <em>introuvable</em></h1>
        <p className="lead">Cette page n&apos;existe pas ou plus.</p>
        <Link href="/" className="btn-primary">Retour à l&apos;accueil</Link>
      </div>
    </div>
  );
}
