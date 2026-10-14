import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { addReview, deleteReview, toggleReview } from '../_actions/content';
import { toLocalInput } from '../_lib/form';
import { Flash, PageHeader, type SearchParams } from '../_components/ui';
import { ConfirmButton, SubmitButton } from '../_components/ConfirmButton';

export const metadata: Metadata = { title: 'Avis' };

export default async function ReviewsAdmin({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const [reviews, restaurants] = await Promise.all([
    db.review.findMany({ include: { restaurant: true }, orderBy: { publishedAt: 'desc' } }),
    db.restaurant.findMany({ orderBy: { position: 'asc' } }),
  ]);

  return (
    <>
      <PageHeader title="Avis Google" sub="Le site affiche uniquement les avis publiés de 4 étoiles et plus, avec un commentaire. Tous comptent dans la note moyenne." />
      <Flash sp={sp} />

      <div className="table-wrapper">
        <table>
          <thead><tr><th>Note</th><th>Auteur</th><th>Restaurant</th><th>Avis</th><th>Date</th><th>Sur le site</th><th></th></tr></thead>
          <tbody>
            {reviews.map((r) => {
              const shown = r.isPublished && r.rating >= 4 && r.text !== '';
              return (
                <tr key={r.id} style={!r.isPublished ? { opacity: 0.55 } : undefined}>
                  <td style={{ whiteSpace: 'nowrap' }}>{r.rating} / 5</td>
                  <td>{r.author}</td>
                  <td>{r.restaurant?.name ?? '—'}</td>
                  <td style={{ maxWidth: 420 }}>{r.text || <span className="muted">(note seule)</span>}</td>
                  <td>{formatDate(r.publishedAt)}</td>
                  <td>
                    <span className={`badge ${shown ? 'badge-on' : 'badge-off'}`}>
                      {shown ? 'Affiché' : !r.isPublished ? 'Masqué' : r.rating < 4 ? 'Note < 4' : 'Sans texte'}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <form action={toggleReview.bind(null, r.id)}><button className="btn-ghost">{r.isPublished ? 'Masquer' : 'Publier'}</button></form>
                      <form action={deleteReview.bind(null, r.id)}><ConfirmButton message="Supprimer cet avis ?">Supprimer</ConfirmButton></form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2 style={{ margin: '2rem 0 1rem', fontSize: '1.1rem' }}>Ajouter un avis Google</h2>
      <form className="admin-form" action={addReview}>
        <div className="grid">
          <label>Auteur *<input name="author" required /></label>
          <label>Note *<input name="rating" type="number" min={1} max={5} defaultValue={5} required /></label>
          <label>Restaurant
            <select name="restaurantId" defaultValue="">
              <option value="">—</option>
              {restaurants.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </label>
          <label>Date de l&apos;avis *<input name="publishedAt" type="datetime-local" defaultValue={toLocalInput(new Date())} required /></label>
          <label className="full">Texte<textarea name="text" rows={3} /></label>
        </div>
        <div className="actions"><SubmitButton>Ajouter</SubmitButton></div>
      </form>
    </>
  );
}
