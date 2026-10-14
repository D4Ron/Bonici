import type { Metadata } from 'next';
import { AuthShell } from '@/components/auth/AuthShell';
import { RegisterForm } from './RegisterForm';
import { Icon } from '@/components/Icon';

export const metadata: Metadata = { title: 'Créer un compte' };

// The old page promised "livraison offerte", "-15 %" and "points fidélité x2", none of which existed.
const PERKS = [
  { icon: 'clipboard' as const, label: 'Toutes vos commandes au même endroit' },
  { icon: 'zap' as const, label: 'Vos coordonnées pré-remplies au moment de commander' },
  { icon: 'bike' as const, label: 'Le suivi de chaque commande en direct' },
];

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <AuthShell
      scope="s-register"
      title="Créer un compte"
      sub="Facultatif : vous pouvez aussi commander sans compte."
      visual={<>
        <h2>Rejoignez<br />la communauté<br /><em>BONICI</em></h2>
        <div className="perks">
          {PERKS.map((p) => (
            <div className="perk" key={p.label}><span className="perk-icon"><Icon name={p.icon} size={20} /></span><span>{p.label}</span></div>
          ))}
        </div>
      </>}
    >
      <RegisterForm next={next ?? ''} />
    </AuthShell>
  );
}
