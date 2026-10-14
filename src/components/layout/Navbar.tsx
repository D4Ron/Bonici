'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { logout } from '@/app/actions/auth';
import { useCart } from '@/components/cart/CartProvider';
import { Icon } from '@/components/Icon';

interface NavUser { name: string; role: 'CUSTOMER' | 'MANAGER' | 'ADMIN' }

const CartIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);
const Chevron = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
);

export function Navbar({ user }: { user: NavUser | null }) {
  const pathname = usePathname();
  const cart = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdown, setDropdown] = useState<string | null>(null);
  const [bumping, setBumping] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); setDropdown(null); }, [pathname]);

  useEffect(() => {
    if (!cart.bump) return;
    setBumping(true);
    const t = setTimeout(() => setBumping(false), 600);
    return () => clearTimeout(t);
  }, [cart.bump]);

  const active = (href: string, exact = false) =>
    (exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)) ? 'active' : undefined;

  const accountLink = user && (user.role === 'CUSTOMER'
    ? <Link href="/compte" className="nav-link">Mon compte</Link>
    : <Link href="/admin" className="nav-link">{user.role === 'ADMIN' ? 'Admin' : 'Dashboard'}</Link>);

  return (
    <div className="s-navbar">
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <div className="nav-container">
          <Link href="/" className="logo">
            <img src="/images/logo-bonici.png" alt="Bonici Africa" style={{ height: 80 }} />
          </Link>

          <ul className="nav-links">
            <li><Link href="/" className={active('/', true)}>Accueil</Link></li>
            <li><Link href="/menus" className={active('/menus')}>Menus</Link></li>
            <li><Link href="/restaurants" className={active('/restaurants')}>Restaurants</Link></li>
            <li><Link href="/suivi" className={active('/suivi')}>Suivi</Link></li>

            <li className="dropdown" onMouseEnter={() => setDropdown('bonplan')} onMouseLeave={() => setDropdown(null)}>
              <Link href="/bon-plan/appels-offre" className={`dropdown-toggle ${active('/bon-plan') ?? ''}`}>
                Bon plan <Chevron />
              </Link>
              <ul className={`dropdown-menu${dropdown === 'bonplan' ? ' show' : ''}`}>
                <li><Link href="/bon-plan/appels-offre" className={active('/bon-plan/appels-offre')}><Icon name="clipboard" size={16} /> Appels d&apos;offre</Link></li>
                <li><Link href="/bon-plan/actualites" className={active('/bon-plan/actualites')}><Icon name="newspaper" size={16} /> Actualités</Link></li>
              </ul>
            </li>

            <li className="dropdown" onMouseEnter={() => setDropdown('carriere')} onMouseLeave={() => setDropdown(null)}>
              <Link href="/carriere/candidature-spontanee" className={`dropdown-toggle ${active('/carriere') ?? ''}`}>
                Carrière <Chevron />
              </Link>
              <ul className={`dropdown-menu${dropdown === 'carriere' ? ' show' : ''}`}>
                <li><Link href="/carriere/candidature-spontanee" className={active('/carriere/candidature-spontanee')}><Icon name="pen" size={16} /> Candidature spontanée</Link></li>
              </ul>
            </li>
          </ul>

          <div className="nav-actions">
            {user ? (
              <>
                {accountLink}
                <form action={logout}><button className="btn-outline">Déconnexion</button></form>
              </>
            ) : (
              <>
                <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="btn-outline">Connexion</Link>
                <Link href="/register" className="btn-primary">Inscription</Link>
              </>
            )}
            <button className={`btn-cart${bumping ? ' cart-bump' : ''}`} aria-label={`Panier (${cart.count})`} onClick={cart.open}>
              <CartIcon />
              {cart.count > 0 && <span className="cart-count" key={cart.count}>{cart.count}</span>}
            </button>
          </div>

          <button className="burger" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu" aria-expanded={menuOpen}>
            <span className={menuOpen ? 'open' : undefined} />
            <span className={menuOpen ? 'open' : undefined} />
            <span className={menuOpen ? 'open' : undefined} />
          </button>
        </div>

        {menuOpen && (
          <div className="mobile-menu">
            <Link href="/">Accueil</Link>
            <Link href="/menus">Menus</Link>
            <Link href="/restaurants">Restaurants</Link>
            <Link href="/suivi">Suivi</Link>
            <a className="mobile-cart" onClick={() => { setMenuOpen(false); cart.open(); }}>Panier ({cart.count})</a>

            <div className="mobile-submenu">
              <span className="mobile-submenu-title">Bon plan</span>
              <Link href="/bon-plan/appels-offre"><Icon name="clipboard" size={16} /> Appels d&apos;offre</Link>
              <Link href="/bon-plan/actualites"><Icon name="newspaper" size={16} /> Actualités</Link>
            </div>
            <div className="mobile-submenu">
              <span className="mobile-submenu-title">Carrière</span>
              <Link href="/carriere/candidature-spontanee"><Icon name="pen" size={16} /> Candidature spontanée</Link>
            </div>

            {user ? (
              <>
                {user.role === 'CUSTOMER' ? <Link href="/compte">Mon compte</Link> : <Link href="/admin">Administration</Link>}
                <form action={logout}><button className="m-logout" style={{ background: 'none', border: 'none', padding: '10px 0', font: 'inherit', fontWeight: 500, cursor: 'pointer' }}>Déconnexion</button></form>
              </>
            ) : (
              <>
                <Link href="/login" className="m-login">Connexion</Link>
                <Link href="/register" className="m-register">Inscription</Link>
              </>
            )}
          </div>
        )}
      </nav>
    </div>
  );
}
