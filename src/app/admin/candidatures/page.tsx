import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { formatDateTime } from '@/lib/format';
import { Flash, PageHeader, type SearchParams } from '../_components/ui';
import { APPLICATION_LABEL } from '../_lib/labels';

export const metadata: Metadata = { title: 'Candidatures' };

export default async function ApplicationsAdmin({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const apps = await db.jobApplication.findMany({ orderBy: { createdAt: 'desc' } });
  return (
    <>
      <PageHeader title="Candidatures spontanées" sub="Données personnelles : accès réservé aux administrateurs." />
      <Flash sp={sp} />
      <div className="table-wrapper">
        <table>
          <thead><tr><th>Candidat</th><th>Email</th><th>Téléphone</th><th>Reçue</th><th>Statut</th></tr></thead>
          <tbody>
            {apps.map((a) => (
              <tr key={a.id}>
                <td><Link href={`/admin/candidatures/${a.id}`}>{a.firstName} {a.lastName}</Link></td>
                <td>{a.email}</td>
                <td>{a.phone}</td>
                <td>{formatDateTime(a.createdAt)}</td>
                <td><span className={`badge ${a.status === 'NEW' ? 'badge-PENDING' : a.status === 'REJECTED' ? 'badge-off' : 'badge-on'}`}>{APPLICATION_LABEL[a.status]}</span></td>
              </tr>
            ))}
            {apps.length === 0 && <tr><td colSpan={5} className="empty">Aucune candidature.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
