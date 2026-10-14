import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { publicUrl } from '@/lib/uploads';
import { saveRestaurant } from '../../_actions/catalog';
import { Flash, ImageField, PageHeader, type SearchParams } from '../../_components/ui';
import { SubmitButton } from '../../_components/ConfirmButton';

export default async function RestaurantForm({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SearchParams }) {
  await requireAdmin();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const isNew = id === 'nouveau';
  const r = isNew ? null : await db.restaurant.findUnique({ where: { id: Number(id) || 0 } });
  if (!isNew && !r) notFound();

  return (
    <>
      <PageHeader title={r ? r.name : 'Nouveau restaurant'} action={r && <Link href={`/admin/restaurants/${r.id}/menu`} className="btn-ghost">Gérer la carte</Link>} />
      <Flash sp={sp} />
      <form className="admin-form" action={saveRestaurant.bind(null, r?.id ?? null)}>
        <div className="grid">
          <label>Nom *<input name="name" defaultValue={r?.name} required /></label>
          <label>Identifiant d&apos;URL<input name="slug" defaultValue={r?.slug} placeholder="généré depuis le nom" /><span className="hint">/menus?restaurant=…</span></label>
          <label>Adresse *<input name="address" defaultValue={r?.address} required /></label>
          <label>Ville *<input name="city" defaultValue={r?.city ?? 'Lomé'} required /></label>
          <label>Téléphone<input name="phone" defaultValue={r?.phone} /></label>
          <label>Email<input name="email" type="email" defaultValue={r?.email} /></label>
          <label>Horaires<input name="openingHours" defaultValue={r?.openingHours} placeholder="Tous les jours, 10h – 23h" /></label>
          <label>Latitude<input name="latitude" inputMode="decimal" defaultValue={r?.latitude ?? ''} placeholder="6.1551752" /></label>
          <label>Longitude<input name="longitude" inputMode="decimal" defaultValue={r?.longitude ?? ''} placeholder="1.2962631" /></label>
          <label>Lien itinéraire (Google Maps)<input name="googleMapsUrl" type="url" defaultValue={r?.googleMapsUrl} placeholder="https://www.google.com/maps?q=…" /><span className="hint">Laissé vide, il est créé à partir des coordonnées.</span></label>
          <label>Fiche Google (avis)<input name="googleReviewUrl" type="url" defaultValue={r?.googleReviewUrl} placeholder="https://www.google.com/maps/place/…" /><span className="hint">Pour le bouton « Donner mon avis ». Facultatif.</span></label>
          <label className="full">Description<textarea name="description" rows={2} defaultValue={r?.description} /></label>
        </div>

        <fieldset>
          <legend>Commandes en ligne</legend>
          <div className="grid">
            <label className="check"><input type="checkbox" name="deliveryEnabled" defaultChecked={r?.deliveryEnabled ?? true} /> Livraison</label>
            <label className="check"><input type="checkbox" name="takeawayEnabled" defaultChecked={r?.takeawayEnabled ?? true} /> À emporter</label>
            <label>Frais de livraison (FCFA)<input name="deliveryFee" type="number" min={0} defaultValue={r?.deliveryFee ?? 500} required /></label>
            <label>Commande minimum (FCFA)<input name="minimumOrder" type="number" min={0} defaultValue={r?.minimumOrder ?? 0} required /></label>
          </div>
        </fieldset>

        <div className="grid">
          <label>Ordre d&apos;affichage<input name="position" type="number" min={0} defaultValue={r?.position ?? 0} /></label>
          <label>ID entrepôt Odoo<input name="odooWarehouseId" type="number" min={1} defaultValue={r?.odooWarehouseId ?? ''} /><span className="hint">Facultatif : entrepôt (stock.warehouse) des commandes de ce restaurant dans Odoo.</span></label>
          <ImageField name="image" label="Photo" current={publicUrl(r?.coverImage)} />
          <label className="check"><input type="checkbox" name="isActive" defaultChecked={r?.isActive ?? true} /> Visible sur le site et ouvert aux commandes</label>
        </div>

        <div className="actions">
          <SubmitButton>Enregistrer</SubmitButton>
          <Link href="/admin/restaurants" className="btn-ghost">Annuler</Link>
        </div>
      </form>
    </>
  );
}
