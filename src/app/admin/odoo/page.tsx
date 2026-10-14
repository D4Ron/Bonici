import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { OdooClient, odooConfig } from '@/lib/odoo';
import { syncAllToOdoo } from '../_actions/orders';
import { Flash, PageHeader, type SearchParams } from '../_components/ui';
import { SubmitButton } from '../_components/ConfirmButton';

export const metadata: Metadata = { title: 'Odoo' };
export const dynamic = 'force-dynamic';

async function checkConnection() {
  const cfg = odooConfig();
  if (!cfg) return null;
  try {
    const client = new OdooClient(cfg);
    const version = await client.version();
    await client.login();
    return { ok: true as const, version };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : String(e) };
  }
}

export default async function OdooPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const cfg = odooConfig();
  const [status, counts, failed, unmapped] = await Promise.all([
    checkConnection(),
    db.order.groupBy({ by: ['odooSyncStatus'], _count: true }),
    db.order.findMany({ where: { odooSyncStatus: 'FAILED' }, select: { id: true, odooError: true }, orderBy: { id: 'desc' }, take: 10 }),
    db.dish.count({ where: { odooProductId: null, isActive: true } }),
  ]);
  const count = (s: string) => counts.find((c) => c.odooSyncStatus === s)?._count ?? 0;

  return (
    <>
      <PageHeader title="Intégration Odoo" sub="Chaque commande du site est créée dans Odoo comme bon de commande (Ventes)." />
      <Flash sp={sp} />

      <div className="card">
        <h2>Connexion</h2>
        {!cfg ? (
          <p>
            Non configurée. Renseignez <code>ODOO_URL</code>, <code>ODOO_DB</code>, <code>ODOO_USERNAME</code> et <code>ODOO_API_KEY</code>
            dans le fichier <code>.env</code> du serveur, puis redémarrez le site. Les commandes continuent de fonctionner sans Odoo.
          </p>
        ) : status?.ok ? (
          <p><span className="badge badge-on">Connecté</span> Odoo {status.version} · {cfg.url} · base « {cfg.db} »</p>
        ) : (
          <p><span className="badge badge-FAILED">Erreur</span> {status?.error}</p>
        )}
      </div>

      <div className="kpi-grid">
        <div className="kpi"><div className="label">Synchronisées</div><div className="value">{count('SYNCED')}</div></div>
        <div className="kpi"><div className="label">En échec</div><div className="value">{count('FAILED')}</div></div>
        <div className="kpi"><div className="label">Non envoyées</div><div className="value">{count('PENDING') + count('DISABLED')}</div></div>
        <div className="kpi"><div className="label">Plats sans produit Odoo</div><div className="value">{unmapped}</div></div>
      </div>

      {cfg && (
        <form action={syncAllToOdoo} className="card">
          <h2>Renvoyer les commandes</h2>
          <p className="muted" style={{ marginBottom: 12 }}>Envoie toutes les commandes en échec ou non envoyées (hors annulées). Sans doublon : une commande déjà présente dans Odoo est reconnue.</p>
          <SubmitButton>Synchroniser maintenant</SubmitButton>
        </form>
      )}

      {failed.length > 0 && (
        <div className="card">
          <h2>Dernières erreurs</h2>
          <table>
            <tbody>
              {failed.map((o) => <tr key={o.id}><td><Link href={`/admin/commandes/${o.id}`}>#{o.id}</Link></td><td>{o.odooError}</td></tr>)}
            </tbody>
          </table>
        </div>
      )}

      <div className="card">
        <h2>Correspondance des produits</h2>
        <p>
          Pour chaque plat, indiquez l&apos;ID du produit Odoo correspondant (fiche du plat, champ « ID produit Odoo »). Les plats sans
          correspondance utilisent le produit générique <code>ODOO_FALLBACK_PRODUCT_ID</code>, avec le nom du plat sur la ligne.
        </p>
      </div>
    </>
  );
}
