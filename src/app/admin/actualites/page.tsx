import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { deleteNews } from '../_actions/content';
import { AddLink, Flash, OnOff, PageHeader, type SearchParams } from '../_components/ui';
import { ConfirmButton } from '../_components/ConfirmButton';

export const metadata: Metadata = { title: 'Actualités' };

export default async function NewsAdmin({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const posts = await db.newsPost.findMany({ orderBy: { publishedAt: 'desc' } });
  return (
    <>
      <PageHeader title="Actualités" action={<AddLink href="/admin/actualites/nouveau">+ Ajouter</AddLink>} />
      <Flash sp={sp} />
      <div className="table-wrapper">
        <table>
          <thead><tr><th>Titre</th><th>Auteur</th><th>Publication</th><th>Publiée</th><th></th></tr></thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id}>
                <td><Link href={`/admin/actualites/${p.id}`}>{p.title}</Link></td>
                <td>{p.author}</td>
                <td>{formatDate(p.publishedAt)}</td>
                <td><OnOff on={p.isPublished} /></td>
                <td><form action={deleteNews.bind(null, p.id)}><ConfirmButton message={`Supprimer « ${p.title} » ?`}>Supprimer</ConfirmButton></form></td>
              </tr>
            ))}
            {posts.length === 0 && <tr><td colSpan={5} className="empty">Aucune actualité.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
