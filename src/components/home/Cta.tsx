import Link from 'next/link';

export function Cta() {
  return (
    <div className="s-cta">
      <section className="cta">
        <div className="cta-bg"><div className="overlay" /></div>
        <div className="cta-content reveal">
          <div className="icon">
            <svg className="cta-svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.22-1.113-.615-1.53a15.04 15.04 0 0 0-2.084-1.637 2.056 2.056 0 0 0-1.58-.86H4.5v16.5h5.25m0-11.177h5.25v11.177m-5.25 0v3.375" />
            </svg>
          </div>
          <h2>Prêt à vous faire livrer ?</h2>
          <p>Commandez maintenant et profitez de la livraison rapide directement chez vous.</p>
          <Link href="/menus" className="btn-cta">
            Commander maintenant
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
