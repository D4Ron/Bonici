import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { deleteTender } from '../_actions/content';
import { AddLink, Flash, PageHeader, type SearchParams } from '../_components/ui';
import { ConfirmButton } from '../_components/ConfirmButton';
import { TENDER_LABEL } from '../_lib/labels';

export const metadata: Metadata = { title: "Appels d'offre" };

export default async function TendersAdmin({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const tenders = await db.tender.findMany({ orderBy: { publishedAt: 'desc' } });
  return (
    <>
      <PageHeader title="Appels d'offre" action={<AddLink href="/admin/appels-offre/nouveau">+ Ajouter</AddLink>} />
      <Flash sp={sp} />
      <div className="table-wrapper">
        <table>
          <thead><tr><th>Réf.</th><th>Titre</th><th>Lieu</th><th>Date limite</th><th>Statut</th><th>Document</th><th></th></tr></thead>
          <tbody>
            {tenders.map((t) => (
              <tr key={t.id}>
                <td>{t.reference}</td>
                <td><Link href={`/admin/appels-offre/${t.id}`}>{t.title}</Link></td>
                <td>{t.location}</td>
                <td>{formatDate(t.deadline)}</td>
                <td><span className={`badge ${t.status === 'CLOSED' ? 'badge-off' : 'badge-on'}`}>{TENDER_LABEL[t.status]}</span></td>
                <td>{t.document ? 'Oui' : <span className="muted">—</span>}</td>
                <td><form action={deleteTender.bind(null, t.id)}><ConfirmButton message={`Supprimer ${t.reference} ?`}>Supprimer</ConfirmButton></form></td>
              </tr>
            ))}
            {tenders.length === 0 && <tr><td colSpan={7} className="empty">Aucun appel d&apos;offre.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
