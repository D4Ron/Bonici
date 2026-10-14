import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { publicUrl } from '@/lib/uploads';
import { saveTender } from '../../_actions/content';
import { toLocalInput } from '../../_lib/form';
import { Flash, PageHeader, type SearchParams } from '../../_components/ui';
import { SubmitButton } from '../../_components/ConfirmButton';

export default async function TenderForm({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SearchParams }) {
  await requireAdmin();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const isNew = id === 'nouveau';
  const t = isNew ? null : await db.tender.findUnique({ where: { id: Number(id) || 0 } });
  if (!isNew && !t) notFound();
  const doc = publicUrl(t?.document);

  return (
    <>
      <PageHeader title={t ? `${t.reference} — ${t.title}` : "Nouvel appel d'offre"} />
      <Flash sp={sp} />
      <form className="admin-form" action={saveTender.bind(null, t?.id ?? null)}>
        <div className="grid">
          <label>Référence *<input name="reference" defaultValue={t?.reference} required /></label>
          <label>Statut
            <select name="status" defaultValue={t?.status ?? 'OPEN'}>
              <option value="OPEN">Actif</option>
              <option value="IN_PROGRESS">En cours</option>
              <option value="CLOSED">Clôturé</option>
            </select>
          </label>
          <label className="full">Titre *<input name="title" defaultValue={t?.title} required /></label>
          <label>Lieu *<input name="location" defaultValue={t?.location ?? 'Lomé'} required /></label>
          <label>Date limite *<input name="deadline" type="datetime-local" defaultValue={toLocalInput(t?.deadline)} required /></label>
          <label className="full">Description *<textarea name="description" rows={6} defaultValue={t?.description} required /></label>
          <label className="full">Document (PDF, DOC, DOCX)
            <input type="file" name="document" accept=".pdf,.doc,.docx" />
            {doc && <span className="hint">Actuel : <a href={doc} target="_blank" rel="noopener noreferrer">ouvrir le document</a>. Laisser vide pour le garder.</span>}
          </label>
        </div>
        <div className="actions">
          <SubmitButton>Enregistrer</SubmitButton>
          <Link href="/admin/appels-offre" className="btn-ghost">Annuler</Link>
        </div>
      </form>
    </>
  );
}
