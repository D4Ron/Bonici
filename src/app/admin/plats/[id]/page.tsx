import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { publicUrl } from '@/lib/uploads';
import { saveDish } from '../../_actions/catalog';
import { Flash, ImageField, PageHeader, type SearchParams } from '../../_components/ui';
import { SubmitButton } from '../../_components/ConfirmButton';

export default async function DishForm({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SearchParams }) {
  await requireAdmin();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const isNew = id === 'nouveau';
  const [d, categories] = await Promise.all([
    isNew ? null : db.dish.findUnique({ where: { id: Number(id) || 0 }, include: { variants: { orderBy: { position: 'asc' } } } }),
    db.category.findMany({ orderBy: { position: 'asc' } }),
  ]);
  if (!isNew && !d) notFound();

  return (
    <>
      <PageHeader title={d ? d.name : 'Nouveau plat'} sub={isNew ? 'Le plat sera ajouté à la carte de tous les restaurants ; retirez-le ensuite là où il n’est pas proposé.' : undefined} />
      <Flash sp={sp} />
      <form className="admin-form" action={saveDish.bind(null, d?.id ?? null)}>
        <div className="grid">
          <label>Nom *<input name="name" defaultValue={d?.name} required /></label>
          <label>Catégorie *
            <select name="categoryId" defaultValue={d?.categoryId} required>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label>Prix (FCFA)<input name="basePrice" type="number" min={1} defaultValue={d?.basePrice} /><span className="hint">Prix unique. Ignoré si le plat a des tailles / variantes. Chaque restaurant peut avoir son propre prix (onglet Carte).</span></label>
          <label>ID produit Odoo<input name="odooProductId" type="number" min={1} defaultValue={d?.odooProductId ?? ''} /><span className="hint">product.product dans Odoo, pour que les commandes utilisent le bon article.</span></label>
          <label className="full">Description<textarea name="description" rows={3} defaultValue={d?.description} /></label>
          <label className="full">Tailles / variantes
            <textarea
              name="variants"
              rows={4}
              defaultValue={d?.variants.map((v) => `${v.label} = ${v.price}`).join('\n')}
              placeholder={'Moyenne = 6000\nGrande = 6500'}
            />
            <span className="hint">Une par ligne, « libellé = prix ». Le client choisit avant d&apos;ajouter au panier. Laisser vide pour un prix unique.</span>
          </label>
          <ImageField current={publicUrl(d?.image)} />
          <label className="check"><input type="checkbox" name="isActive" defaultChecked={d?.isActive ?? true} /> Visible sur le site</label>
          <label className="check"><input type="checkbox" name="isFeatured" defaultChecked={d?.isFeatured ?? false} /> Mis en avant dans « Les plus populaires »</label>
        </div>
        <div className="actions">
          <SubmitButton>Enregistrer</SubmitButton>
          <Link href="/admin/plats" className="btn-ghost">Annuler</Link>
        </div>
      </form>
    </>
  );
}
