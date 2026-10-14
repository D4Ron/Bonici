import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requireStaff } from '@/lib/auth';
import { canManageRestaurant } from '@/lib/permissions';
import { formatPrice } from '@/lib/format';
import { publicUrl } from '@/lib/uploads';
import { saveMenu } from '../../../_actions/catalog';
import { Flash, PageHeader, type SearchParams } from '../../../_components/ui';
import { SubmitButton } from '../../../_components/ConfirmButton';

export const dynamic = 'force-dynamic';

export default async function MenuAdmin({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SearchParams }) {
  const [{ id }, sp, user] = await Promise.all([params, searchParams, requireStaff()]);
  const restaurantId = Number(id) || 0;
  if (!canManageRestaurant(user, restaurantId)) notFound();
  const restaurant = await db.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant) notFound();
  const isAdmin = user.role === 'ADMIN';

  const [dishes, items] = await Promise.all([
    db.dish.findMany({ include: { category: true, _count: { select: { variants: true } } }, orderBy: [{ category: { position: 'asc' } }, { name: 'asc' }] }),
    db.menuItem.findMany({ where: { restaurantId } }),
  ]);
  const byDish = new Map(items.map((i) => [i.dishId, i]));
  const rows = isAdmin ? dishes : dishes.filter((d) => byDish.has(d.id));

  return (
    <>
      <PageHeader
        title={`Carte — ${restaurant.name}`}
        sub={isAdmin
          ? "Cochez les plats proposés dans ce restaurant. Laissez le prix vide pour utiliser le prix de base du plat."
          : 'Marquez un plat indisponible quand il est en rupture, et choisissez le menu du jour.'}
      />
      <Flash sp={sp} />
      <form action={saveMenu.bind(null, restaurantId)}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {isAdmin && <th>À la carte</th>}
                <th></th><th>Plat</th><th>Catégorie</th><th>Prix de base</th>
                {isAdmin && <th>Prix ici</th>}
                <th>Disponible</th><th>Menu du jour</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => {
                const mi = byDish.get(d.id);
                return (
                  <tr key={d.id} style={!d.isActive ? { opacity: 0.5 } : undefined}>
                    {isAdmin && <td><input type="checkbox" name={`on-${d.id}`} defaultChecked={!!mi} aria-label={`${d.name} à la carte`} /></td>}
                    <td>{publicUrl(d.image) && <img className="thumb" src={publicUrl(d.image)!} alt="" />}</td>
                    <td>{d.name}{!d.isActive && <span className="muted"> (masqué)</span>}</td>
                    <td>{d.category.name}</td>
                    <td>{d._count.variants ? <>dès {formatPrice(d.basePrice)}</> : formatPrice(d.basePrice)}</td>
                    {isAdmin && (
                      <td>
                        {d._count.variants
                          ? <span className="muted">{d._count.variants} variantes (prix sur la fiche du plat)</span>
                          : <input className="small" type="number" min={1} name={`price-${d.id}`} defaultValue={mi?.price ?? ''} placeholder={String(d.basePrice)} />}
                      </td>
                    )}
                    <td><input type="checkbox" name={`available-${d.id}`} defaultChecked={mi?.isAvailable ?? true} aria-label={`${d.name} disponible`} /></td>
                    <td><input type="radio" name="dailySpecial" value={d.id} defaultChecked={mi?.isDailySpecial} aria-label={`${d.name} menu du jour`} /></td>
                  </tr>
                );
              })}
              <tr>
                <td colSpan={isAdmin ? 7 : 5} style={{ textAlign: 'right' }} className="muted">Pas de menu du jour</td>
                <td><input type="radio" name="dailySpecial" value="" defaultChecked={!items.some((i) => i.isDailySpecial)} aria-label="Pas de menu du jour" /></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: '1rem' }}><SubmitButton>Enregistrer la carte</SubmitButton></div>
      </form>
    </>
  );
}
