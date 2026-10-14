import type { Metadata } from 'next';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { OrderLookup, RecentOrders } from './OrderLookup';

export const metadata: Metadata = { title: 'Suivi de commande' };

export default async function SuiviPage() {
  const user = await getCurrentUser();
  return (
    <div className="s-suivi">
      <div className="suivi-page">
        <div className="suivi-hero">
          <h1>Suivre ma <em>commande</em></h1>
          <p>Entrez le numéro de votre commande et le téléphone utilisé pour la passer.</p>
          <OrderLookup />
        </div>
        <div className="suivi-body">
          <RecentOrders />
          {user && (
            <p style={{ textAlign: 'center', marginTop: 24 }}>
              Toutes vos commandes sont aussi dans <Link href="/compte" style={{ color: '#C3102F', fontWeight: 600 }}>votre compte</Link>.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
