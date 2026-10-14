import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { formatDateTime } from '@/lib/format';
import { deleteApplication, setApplicationStatus } from '../../_actions/content';
import { Flash, PageHeader, type SearchParams } from '../../_components/ui';
import { ConfirmButton, SubmitButton } from '../../_components/ConfirmButton';
import { APPLICATION_LABEL } from '../../_lib/labels';
import { Icon } from '@/components/Icon';

export default async function ApplicationDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SearchParams }) {
  await requireAdmin();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const a = await db.jobApplication.findUnique({ where: { id: Number(id) || 0 } });
  if (!a) notFound();

  return (
    <>
      <PageHeader title={`${a.firstName} ${a.lastName}`} sub={`Reçue le ${formatDateTime(a.createdAt)}`} action={<Link href="/admin/candidatures" className="btn-ghost"><Icon name="arrowLeft" size={14} /> Candidatures</Link>} />
      <Flash sp={sp} />
      <div className="order-detail-grid">
        <div className="card">
          <h2>Message</h2>
          <p style={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>{a.message}</p>
        </div>
        <div>
          <div className="card">
            <dl>
              <dt>Email</dt><dd><a href={`mailto:${a.email}`}>{a.email}</a></dd>
              <dt>Téléphone</dt><dd><a href={`tel:${a.phone}`}>{a.phone}</a></dd>
              <dt>CV</dt><dd><a href={`/admin/candidatures/${a.id}/fichier/cv`}>Télécharger</a></dd>
              <dt>Lettre</dt><dd>{a.letterFile ? <a href={`/admin/candidatures/${a.id}/fichier/lettre`}>Télécharger</a> : '—'}</dd>
            </dl>
          </div>
          <form className="card" action={setApplicationStatus.bind(null, a.id)}>
            <h2>Statut</h2>
            <select name="status" defaultValue={a.status} style={{ padding: 8, borderRadius: 8, border: '1px solid #ddd', marginRight: 8 }}>
              {Object.entries(APPLICATION_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <SubmitButton>Enregistrer</SubmitButton>
          </form>
          <form action={deleteApplication.bind(null, a.id)}>
            <ConfirmButton message="Supprimer définitivement cette candidature et ses fichiers ?">Supprimer la candidature</ConfirmButton>
          </form>
        </div>
      </div>
    </>
  );
}
