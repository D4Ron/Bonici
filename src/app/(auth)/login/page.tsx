import type { Metadata } from 'next';
import { AuthShell } from '@/components/auth/AuthShell';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = { title: 'Connexion' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <AuthShell
      scope="s-login"
      title="Connexion"
      sub="Bienvenue ! Entrez vos identifiants pour continuer."
      visual={<>
        <h2>Retrouvez tous<br />vos plats préférés</h2>
        <p>Connectez-vous pour retrouver vos commandes. Pas de compte ? Vous pouvez aussi commander sans.</p>
      </>}
    >
      <LoginForm next={next ?? ''} />
    </AuthShell>
  );
}
