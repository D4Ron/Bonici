import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { formatPrice } from '@/lib/format';
import { deleteRestaurant } from '../_actions/catalog';
import { AddLink, Flash, OnOff, PageHeader, type SearchParams } from '../_components/ui';
import { ConfirmButton } from '../_components/ConfirmButton';

export const metadata: Metadata = { title: 'Restaurants' };

export default async function RestaurantsAdmin({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const restaurants = await db.restaurant.findMany({
    orderBy: [{ position: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { menuItems: true, managers: true } } },
  });

  return (
    <>
      <PageHeader title="Restaurants" action={<AddLink href="/admin/restaurants/nouveau">+ Ajouter</AddLink>} />
      <Flash sp={sp} />
      <div className="table-wrapper">
        <table>
          <thead><tr><th>Nom</th><th>Adresse</th><th>Téléphone</th><th>Livraison</th><th>Carte</th><th>En ligne</th><th></th></tr></thead>
          <tbody>
            {restaurants.map((r) => (
              <tr key={r.id}>
                <td><Link href={`/admin/restaurants/${r.id}`}>{r.name}</Link></td>
                <td>{r.address}, {r.city}</td>
                <td>{r.phone}</td>
                <td>{r.deliveryEnabled ? formatPrice(r.deliveryFee) : <span className="muted">non</span>}</td>
                <td><Link href={`/admin/restaurants/${r.id}/menu`}>{r._count.menuItems} plats</Link></td>
                <td><OnOff on={r.isActive} /></td>
                <td>
                  <form action={deleteRestaurant.bind(null, r.id)}>
                    <ConfirmButton message={`Supprimer ${r.name} ?`}>Supprimer</ConfirmButton>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
