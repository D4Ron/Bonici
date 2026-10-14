import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { publicUrl } from '@/lib/uploads';
import { deleteCategory } from '../_actions/catalog';
import { AddLink, Flash, OnOff, PageHeader, type SearchParams } from '../_components/ui';
import { ConfirmButton } from '../_components/ConfirmButton';

export const metadata: Metadata = { title: 'Catégories' };

export default async function CategoriesAdmin({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const categories = await db.category.findMany({ orderBy: [{ position: 'asc' }, { name: 'asc' }], include: { _count: { select: { dishes: true } } } });
  return (
    <>
      <PageHeader title="Catégories" action={<AddLink href="/admin/categories/nouveau">+ Ajouter</AddLink>} />
      <Flash sp={sp} />
      <div className="table-wrapper">
        <table>
          <thead><tr><th></th><th>Nom</th><th>Plats</th><th>Ordre</th><th>Active</th><th></th></tr></thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <td>{publicUrl(c.image) && <img className="thumb" src={publicUrl(c.image)!} alt="" />}</td>
                <td><Link href={`/admin/categories/${c.id}`}>{c.name}</Link></td>
                <td>{c._count.dishes}</td>
                <td>{c.position}</td>
                <td><OnOff on={c.isActive} /></td>
                <td><form action={deleteCategory.bind(null, c.id)}><ConfirmButton message={`Supprimer ${c.name} ?`}>Supprimer</ConfirmButton></form></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
