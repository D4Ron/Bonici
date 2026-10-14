'use client';

import { useActionState } from 'react';
import { requestPasswordReset } from '@/app/actions/auth';
import { AuthShell, MailIcon } from '@/components/auth/AuthShell';

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);
  return (
    <AuthShell
      scope="s-login"
      title="Mot de passe oublié"
      sub="Indiquez l'email de votre compte : nous vous enverrons un lien pour en choisir un nouveau."
      visual={<h2>Pas de souci,<br />ça arrive !</h2>}
    >
      {state?.error && <div className="alert-error" role="alert">{state.error}</div>}
      {state?.success ? (
        <div className="alert-success" role="status">{state.success}</div>
      ) : (
        <form action={action}>
          <div className="form-group">
            <label htmlFor="email">Adresse email</label>
            <div className="input-wrap"><MailIcon /><input id="email" type="email" name="email" placeholder="votre@email.com" required autoComplete="email" /></div>
          </div>
          <button type="submit" className="btn-submit" disabled={pending}>
            {pending ? <><span className="spinner" /> Envoi...</> : 'Envoyer le lien'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
