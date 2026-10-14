import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { publicUrl } from '@/lib/uploads';
import { saveCategory } from '../../_actions/catalog';
import { Flash, ImageField, PageHeader, type SearchParams } from '../../_components/ui';
import { SubmitButton } from '../../_components/ConfirmButton';

export default async function CategoryForm({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SearchParams }) {
  await requireAdmin();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const isNew = id === 'nouveau';
  const c = isNew ? null : await db.category.findUnique({ where: { id: Number(id) || 0 } });
  if (!isNew && !c) notFound();

  return (
    <>
      <PageHeader title={c ? c.name : 'Nouvelle catégorie'} />
      <Flash sp={sp} />
      <form className="admin-form" action={saveCategory.bind(null, c?.id ?? null)}>
        <div className="grid">
          <label>Nom *<input name="name" defaultValue={c?.name} required /></label>
          <label>Identifiant d&apos;URL<input name="slug" defaultValue={c?.slug} placeholder="généré depuis le nom" /></label>
          <label>Ordre d&apos;affichage<input name="position" type="number" min={0} defaultValue={c?.position ?? 0} /></label>
          <label className="check"><input type="checkbox" name="isActive" defaultChecked={c?.isActive ?? true} /> Active</label>
          <ImageField current={publicUrl(c?.image)} />
        </div>
        <div className="actions">
          <SubmitButton>Enregistrer</SubmitButton>
          <Link href="/admin/categories" className="btn-ghost">Annuler</Link>
        </div>
      </form>
    </>
  );
}
