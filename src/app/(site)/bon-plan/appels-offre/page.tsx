import type { Metadata } from 'next';
import Link from 'next/link';
import type { TenderStatus } from '@prisma/client';
import { db } from '@/lib/db';
import { formatDate } from '@/lib/format';
import { publicUrl } from '@/lib/uploads';
import { Icon } from '@/components/Icon';

export const metadata: Metadata = { title: "Appels d'offre" };
export const dynamic = 'force-dynamic';

const FILTERS: { key: string; label: string; status?: TenderStatus }[] = [
  { key: 'tous', label: 'Tous' },
  { key: 'actifs', label: 'Actifs', status: 'OPEN' },
  { key: 'en-cours', label: 'En cours', status: 'IN_PROGRESS' },
  { key: 'clotures', label: 'Clôturés', status: 'CLOSED' },
];
// Class names expected by the ported stylesheet.
const BADGE: Record<TenderStatus, [string, string]> = {
  OPEN: ['actif', 'Actif'],
  IN_PROGRESS: ['en_cours', 'En cours'],
  CLOSED: ['cloture', 'Clôturé'],
};

export default async function TendersPage({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  const { statut } = await searchParams;
  const filter = FILTERS.find((f) => f.key === statut) ?? FILTERS[0];
  const tenders = await db.tender.findMany({
    where: filter.status ? { status: filter.status } : {},
    orderBy: { publishedAt: 'desc' },
  });

  return (
    <div className="s-offres">
      <div className="appels-offre">
        <div className="section-header reveal">
          <h2>Appels d&apos;<span>offre</span></h2>
          <p>Consultez nos appels d&apos;offre en cours et proposez vos services</p>
        </div>

        <div className="filters">
          {FILTERS.map((f) => (
            <Link key={f.key} href={f.key === 'tous' ? '/bon-plan/appels-offre' : `/bon-plan/appels-offre?statut=${f.key}`}
              className={`filter-btn${f.key === filter.key ? ' active' : ''}`} scroll={false}>
              {f.label}
            </Link>
          ))}
        </div>

        {tenders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Icon name="inbox" size={48} /></div>
            <h3>Aucun appel d&apos;offre</h3>
            <p>Il n&apos;y a pas d&apos;appel d&apos;offre correspondant à ce filtre pour le moment.</p>
          </div>
        ) : (
          <div className="offers-grid">
            {tenders.map((t, i) => {
              const [cls, label] = BADGE[t.status];
              const doc = publicUrl(t.document);
              return (
                <div className="offer-card reveal" style={{ ['--i' as string]: i % 6 }} key={t.id}>
                  <span className={`offer-badge ${cls}`}>{label}</span>
                  <div className="offer-ref">RÉF. {t.reference}</div>
                  <h3>{t.title}</h3>
                  <p className="offer-description">{t.description}</p>
                  <div className="offer-meta">
                    <span><Icon name="pin" size={14} /> {t.location}</span>
                    <span><Icon name="clock" size={14} /> Limite : {formatDate(t.deadline)}</span>
                  </div>
                  <div className="offer-footer">
                    {doc ? (
                      <a className="btn-details" href={doc} target="_blank" rel="noopener noreferrer">
                        Voir le document
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                      </a>
                    ) : <span />}
                    <span className="offer-date">Publié le {formatDate(t.publishedAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
