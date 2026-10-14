import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { formatDate } from '@/lib/format';
import { publicUrl } from '@/lib/uploads';
import { ReadMore } from './ReadMore';
import { Icon } from '@/components/Icon';

export const metadata: Metadata = { title: 'Actualités' };
export const dynamic = 'force-dynamic';

export default async function NewsPage() {
  const posts = await db.newsPost.findMany({
    where: { isPublished: true, publishedAt: { lte: new Date() } },
    orderBy: { publishedAt: 'desc' },
  });

  return (
    <div className="s-actualites">
      <div className="actualites">
        <div className="section-header reveal">
          <h2>Nos <span>actualités</span></h2>
          <p>Toute l&apos;actualité de BONICI Africa</p>
        </div>

        {posts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Icon name="newspaper" size={48} /></div>
            <h3>Aucune actualité</h3>
            <p>Revenez bientôt pour découvrir nos prochaines actualités.</p>
          </div>
        ) : (
          <div className="actualites-list">
            {posts.map((p, i) => (
              <article className="actu-card reveal" style={{ ['--i' as string]: i % 4 }} key={p.id}>
                <div className="actu-image">
                  <img src={publicUrl(p.image) ?? '/images/logo-bonici.png'} alt={p.title} loading="lazy" />
                </div>
                <div className="actu-content">
                  <div className="actu-meta">
                    <span><Icon name="calendar" size={14} /> {formatDate(p.publishedAt)}</span>
                    {p.author && <span><Icon name="pen" size={14} /> {p.author}</span>}
                  </div>
                  <h3>{p.title}</h3>
                  <ReadMore text={p.body} />
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
