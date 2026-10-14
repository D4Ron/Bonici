'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { login } from '@/app/actions/auth';
import { LockIcon, MailIcon } from '@/components/auth/AuthShell';
import { Icon } from '@/components/Icon';

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, undefined);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  return (
    <>
      {state?.error && <div className="alert-error" role="alert">{state.error}</div>}
      <form action={action}>
        <input type="hidden" name="next" value={next} />
        <div className="form-group">
          <label htmlFor="email">Adresse email</label>
          <div className="input-wrap">
            <MailIcon />
            <input id="email" type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com" required autoComplete="email" />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="password">
            Mot de passe
            <Link href="/mot-de-passe-oublie" className="forgot">Mot de passe oublié ?</Link>
          </label>
          <div className="input-wrap">
            <LockIcon />
            <input id="password" type={showPwd ? 'text' : 'password'} name="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required autoComplete="current-password" />
            <button type="button" className="eye-btn" onClick={() => setShowPwd((v) => !v)} aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
              <Icon name={showPwd ? 'eyeOff' : 'eye'} />
            </button>
          </div>
        </div>

        <button type="submit" className="btn-submit" disabled={pending}>
          {pending ? <><span className="spinner" /> Connexion...</> : 'Se connecter'}
        </button>
      </form>

      <p className="switch">Pas encore de compte ? <Link href={next ? `/register?next=${encodeURIComponent(next)}` : '/register'}>Créer un compte</Link></p>
    </>
  );
}
