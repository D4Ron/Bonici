import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { formatPrice } from '@/lib/format';
import { publicUrl } from '@/lib/uploads';
import { deleteDish } from '../_actions/catalog';
import { AddLink, Flash, OnOff, PageHeader, type SearchParams } from '../_components/ui';
import { ConfirmButton } from '../_components/ConfirmButton';
import { Star } from '@/components/Icon';

export const metadata: Metadata = { title: 'Plats' };

export default async function DishesAdmin({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const dishes = await db.dish.findMany({
    include: { category: true, _count: { select: { menuItems: true, variants: true } } },
    orderBy: [{ category: { position: 'asc' } }, { name: 'asc' }],
  });
  return (
    <>
      <PageHeader title="Plats" sub={`${dishes.length} plat(s)`} action={<AddLink href="/admin/plats/nouveau">+ Ajouter</AddLink>} />
      <Flash sp={sp} />
      <div className="table-wrapper">
        <table>
          <thead><tr><th></th><th>Nom</th><th>Catégorie</th><th>Prix de base</th><th>Restaurants</th><th>Populaire</th><th>Odoo</th><th>Actif</th><th></th></tr></thead>
          <tbody>
            {dishes.map((d) => (
              <tr key={d.id}>
                <td>{publicUrl(d.image) && <img className="thumb" src={publicUrl(d.image)!} alt="" />}</td>
                <td><Link href={`/admin/plats/${d.id}`}>{d.name}</Link></td>
                <td>{d.category.name}</td>
                <td>{d._count.variants ? <>dès {formatPrice(d.basePrice)}<br /><span className="muted">{d._count.variants} variantes</span></> : formatPrice(d.basePrice)}</td>
                <td>{d._count.menuItems}</td>
                <td>{d.isFeatured ? <Star /> : ''}</td>
                <td>{d.odooProductId ?? <span className="muted">—</span>}</td>
                <td><OnOff on={d.isActive} /></td>
                <td><form action={deleteDish.bind(null, d.id)}><ConfirmButton message={`Supprimer ${d.name} ?`}>Supprimer</ConfirmButton></form></td>
              </tr>
            ))}
            {dishes.length === 0 && <tr><td colSpan={9} className="empty">Aucun plat. Commencez par en ajouter un.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
