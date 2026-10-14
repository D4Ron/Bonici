import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { requireStaff } from '@/lib/auth';
import { db } from '@/lib/db';
import { restaurantScope } from '@/lib/permissions';
import { logout } from '@/app/actions/auth';
import { AdminNav } from './_components/AdminNav';
import { Icon } from '@/components/Icon';

export const metadata: Metadata = { title: { default: 'Administration', template: '%s · Admin BONICI' }, robots: { index: false } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireStaff();
  const scope = restaurantScope(user);
  const [pending, restaurant] = await Promise.all([
    db.order.count({ where: { status: 'PENDING', ...(scope !== undefined && { restaurantId: scope }) } }),
    user.restaurantId ? db.restaurant.findUnique({ where: { id: user.restaurantId }, select: { id: true, name: true } }) : null,
  ]);

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <Link href="/admin"><img src="/images/logo-bonici.png" alt="Bonici" /></Link>
        <div className="who">
          <strong>{user.name}</strong>
          {user.role === 'ADMIN' ? 'Administrateur' : `Gérant · ${restaurant?.name ?? 'aucun restaurant'}`}
        </div>
        <AdminNav isAdmin={user.role === 'ADMIN'} pendingOrders={pending} managerRestaurantId={user.role === 'MANAGER' ? restaurant?.id ?? null : null} />
        <div className="bottom">
          <Link href="/" target="_blank">Voir le site <Icon name="external" size={14} /></Link>
          <form action={logout}><button style={{ width: '100%' }}>Déconnexion</button></form>
        </div>
      </aside>
      <main className="main admin-page">{children}</main>
    </div>
  );
}
