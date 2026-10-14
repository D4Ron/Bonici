import Link from 'next/link';
import { listRestaurants } from '@/lib/catalog';

// The old footer used Font Awesome from a CDN for three icons; inline SVGs instead.
const Clock = () => (
  <i><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg></i>
);
const Phone = () => (
  <i><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" /></svg></i>
);
const Mail = () => (
  <i><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg></i>
);

export async function Footer() {
  const restaurants = await listRestaurants();
  const email = process.env.CONTACT_EMAIL;

  return (
    <div className="s-footer">
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <p>Pizzas, burgers, chawarmas, poulets et poissons braisés — à Lomé, Aného, Kpalimé et Kara, en livraison ou à emporter.</p>
          </div>

          <div className="footer-col">
            <h4>Liens</h4>
            <ul>
              <li><Link href="/">Accueil</Link></li>
              <li><Link href="/menus">Menus</Link></li>
              <li><Link href="/restaurants">Restaurants</Link></li>
              <li><Link href="/suivi">Suivi</Link></li>
              <li><Link href="/avis">Avis clients</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Informations</h4>
            <ul>
              <li><Link href="/a-propos">À propos</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/cgu">CGU</Link></li>
              <li><Link href="/confidentialite">Confidentialité</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Nos restaurants</h4>
            <ul className="hours-list">
              {restaurants.map((r) => (
                <li key={r.id}><Clock /> {r.name}{r.openingHours && ` · ${r.openingHours}`}</li>
              ))}
            </ul>
            <div className="contact-mini">
              {restaurants.filter((r) => r.phone).map((r) => (
                <p key={r.id}><Phone /> <a href={`tel:+228${r.phone.replace(/\D/g, '')}`} style={{ color: 'inherit', textDecoration: 'none' }}>{r.phone}</a>&nbsp;· {r.name.replace(/^Bonici\s*/i, '')}</p>
              ))}
              {email && <p><Mail /> {email}</p>}
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>Copyright © {new Date().getFullYear()}. BONICI — Tous droits réservés.</span>
        </div>
      </footer>
    </div>
  );
}
