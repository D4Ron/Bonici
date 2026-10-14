'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, type IconName } from '@/components/Icon';

export function AdminNav({ isAdmin, pendingOrders, managerRestaurantId }: {
  isAdmin: boolean;
  pendingOrders: number;
  managerRestaurantId: number | null;
}) {
  const pathname = usePathname();
  const link = (href: string, icon: IconName, label: string, badge?: number) => {
    const active = href === '/admin' ? pathname === href : pathname.startsWith(href);
    return (
      <Link key={href} href={href} className={active ? 'active' : undefined}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Icon name={icon} size={16} />{label}</span>
        {!!badge && <span className="nav-badge">{badge}</span>}
      </Link>
    );
  };

  return (
    <nav>
      {link('/admin', 'dashboard', 'Tableau de bord')}
      {link('/admin/commandes', 'receipt', 'Commandes', pendingOrders)}
      {isAdmin ? (
        <>
          <span className="group">Carte</span>
          {link('/admin/restaurants', 'store', 'Restaurants')}
          {link('/admin/plats', 'utensils', 'Plats')}
          {link('/admin/categories', 'folder', 'Catégories')}
          {link('/admin/promotions', 'tag', 'Promotions')}
          <span className="group">Contenu</span>
          {link('/admin/avis', 'star', 'Avis')}
          {link('/admin/actualites', 'newspaper', 'Actualités')}
          {link('/admin/appels-offre', 'clipboard', "Appels d'offre")}
          {link('/admin/candidatures', 'file', 'Candidatures')}
          <span className="group">Réglages</span>
          {link('/admin/utilisateurs', 'users', 'Utilisateurs')}
          {link('/admin/odoo', 'link', 'Odoo')}
        </>
      ) : (
        managerRestaurantId && link(`/admin/restaurants/${managerRestaurantId}/menu`, 'utensils', 'Ma carte')
      )}
    </nav>
  );
}
