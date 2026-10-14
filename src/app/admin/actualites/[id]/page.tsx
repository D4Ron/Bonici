import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { publicUrl } from '@/lib/uploads';
import { saveNews } from '../../_actions/content';
import { toLocalInput } from '../../_lib/form';
import { Flash, ImageField, PageHeader, type SearchParams } from '../../_components/ui';
import { SubmitButton } from '../../_components/ConfirmButton';

export default async function NewsForm({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SearchParams }) {
  await requireAdmin();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const isNew = id === 'nouveau';
  const p = isNew ? null : await db.newsPost.findUnique({ where: { id: Number(id) || 0 } });
  if (!isNew && !p) notFound();

  return (
    <>
      <PageHeader title={p ? p.title : 'Nouvelle actualité'} />
      <Flash sp={sp} />
      <form className="admin-form" action={saveNews.bind(null, p?.id ?? null)}>
        <div className="grid">
          <label className="full">Titre *<input name="title" defaultValue={p?.title} required /></label>
          <label>Auteur<input name="author" defaultValue={p?.author} /></label>
          <label>Date de publication *<input name="publishedAt" type="datetime-local" defaultValue={toLocalInput(p?.publishedAt ?? new Date())} required /><span className="hint">Une date future programme la publication.</span></label>
          <label className="full">Texte *<textarea name="body" rows={10} defaultValue={p?.body} required /></label>
          <ImageField current={publicUrl(p?.image)} />
          <label className="check"><input type="checkbox" name="isPublished" defaultChecked={p?.isPublished ?? true} /> Publiée</label>
        </div>
        <div className="actions">
          <SubmitButton>Enregistrer</SubmitButton>
          <Link href="/admin/actualites" className="btn-ghost">Annuler</Link>
        </div>
      </form>
    </>
  );
}
