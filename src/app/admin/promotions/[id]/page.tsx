import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { savePromotion } from '../../_actions/catalog';
import { toLocalInput } from '../../_lib/form';
import { Flash, PageHeader, type SearchParams } from '../../_components/ui';
import { SubmitButton } from '../../_components/ConfirmButton';

export default async function PromotionForm({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SearchParams }) {
  await requireAdmin();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const isNew = id === 'nouveau';
  const [p, restaurants, dishes] = await Promise.all([
    isNew ? null : db.promotion.findUnique({ where: { id: Number(id) || 0 }, include: { dishes: { select: { id: true } } } }),
    db.restaurant.findMany({ orderBy: { position: 'asc' } }),
    db.dish.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
  ]);
  if (!isNew && !p) notFound();
  const selected = new Set(p?.dishes.map((d) => d.id));

  return (
    <>
      <PageHeader title={p ? p.title : 'Nouvelle promotion'} sub="Si plusieurs promotions visent un même plat, la plus forte s'applique (elles ne se cumulent pas)." />
      <Flash sp={sp} />
      <form className="admin-form" action={savePromotion.bind(null, p?.id ?? null)}>
        <div className="grid">
          <label>Titre *<input name="title" defaultValue={p?.title} required placeholder="Semaine du burger" /></label>
          <label>Restaurant
            <select name="restaurantId" defaultValue={p?.restaurantId ?? ''}>
              <option value="">Tous les restaurants</option>
              {restaurants.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </label>
          <label>Remise (%) *<input name="discountPercent" type="number" min={1} max={90} defaultValue={p?.discountPercent ?? 10} required /></label>
          <label className="check"><input type="checkbox" name="isActive" defaultChecked={p?.isActive ?? true} /> Active</label>
          <label>Début *<input name="startsAt" type="datetime-local" defaultValue={toLocalInput(p?.startsAt ?? new Date())} required /></label>
          <label>Fin *<input name="endsAt" type="datetime-local" defaultValue={toLocalInput(p?.endsAt)} required /></label>
        </div>
        <fieldset>
          <legend>Plats concernés *</legend>
          <div className="checklist">
            {dishes.map((d) => (
              <label key={d.id} className="check"><input type="checkbox" name="dishes" value={d.id} defaultChecked={selected.has(d.id)} /> {d.name}</label>
            ))}
          </div>
        </fieldset>
        <div className="actions">
          <SubmitButton>Enregistrer</SubmitButton>
          <Link href="/admin/promotions" className="btn-ghost">Annuler</Link>
        </div>
      </form>
    </>
  );
}
