import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { deleteUser } from '../_actions/content';
import { AddLink, Flash, PageHeader, type SearchParams } from '../_components/ui';
import { ConfirmButton } from '../_components/ConfirmButton';

export const metadata: Metadata = { title: 'Utilisateurs' };

const ROLE = { ADMIN: 'Administrateur', MANAGER: 'Gérant', CUSTOMER: 'Client' } as const;

export default async function UsersAdmin({ searchParams }: { searchParams: SearchParams }) {
  const me = await requireAdmin();
  const sp = await searchParams;
  const users = await db.user.findMany({
    include: { restaurant: { select: { name: true } }, _count: { select: { orders: true } } },
    orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
  });
  return (
    <>
      <PageHeader title="Utilisateurs" sub="Créez ici les comptes des gérants de restaurant." action={<AddLink href="/admin/utilisateurs/nouveau">+ Ajouter</AddLink>} />
      <Flash sp={sp} />
      <div className="table-wrapper">
        <table>
          <thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Restaurant</th><th>Commandes</th><th>Créé le</th><th></th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td><Link href={`/admin/utilisateurs/${u.id}`}>{u.name}</Link></td>
                <td>{u.email}</td>
                <td>{ROLE[u.role]}</td>
                <td>{u.restaurant?.name ?? '—'}</td>
                <td>{u._count.orders}</td>
                <td>{formatDate(u.createdAt)}</td>
                <td>{u.id !== me.id && <form action={deleteUser.bind(null, u.id)}><ConfirmButton message={`Supprimer le compte de ${u.name} ?`}>Supprimer</ConfirmButton></form>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
