import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { deletePromotion } from '../_actions/catalog';
import { AddLink, Flash, PageHeader, type SearchParams } from '../_components/ui';
import { ConfirmButton } from '../_components/ConfirmButton';

export const metadata: Metadata = { title: 'Promotions' };

export default async function PromotionsAdmin({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const now = new Date();
  const promos = await db.promotion.findMany({ include: { restaurant: true, dishes: { select: { name: true } } }, orderBy: { endsAt: 'desc' } });
  return (
    <>
      <PageHeader title="Promotions" action={<AddLink href="/admin/promotions/nouveau">+ Ajouter</AddLink>} />
      <Flash sp={sp} />
      <div className="table-wrapper">
        <table>
          <thead><tr><th>Titre</th><th>Restaurant</th><th>Plats</th><th>Remise</th><th>Période</th><th>État</th><th></th></tr></thead>
          <tbody>
            {promos.map((p) => {
              const live = p.isActive && p.startsAt <= now && p.endsAt >= now;
              return (
                <tr key={p.id}>
                  <td><Link href={`/admin/promotions/${p.id}`}>{p.title}</Link></td>
                  <td>{p.restaurant?.name ?? 'Tous'}</td>
                  <td>{p.dishes.map((d) => d.name).join(', ')}</td>
                  <td>-{p.discountPercent}%</td>
                  <td>{formatDate(p.startsAt)} – {formatDate(p.endsAt)}</td>
                  <td><span className={`badge ${live ? 'badge-on' : 'badge-off'}`}>{live ? 'En cours' : !p.isActive ? 'Désactivée' : p.endsAt < now ? 'Terminée' : 'À venir'}</span></td>
                  <td><form action={deletePromotion.bind(null, p.id)}><ConfirmButton message={`Supprimer « ${p.title} » ?`}>Supprimer</ConfirmButton></form></td>
                </tr>
              );
            })}
            {promos.length === 0 && <tr><td colSpan={7} className="empty">Aucune promotion.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
