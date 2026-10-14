'use client';

import { use, useActionState } from 'react';
import { resetPassword } from '@/app/actions/auth';
import { AuthShell, LockIcon } from '@/components/auth/AuthShell';

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [state, action, pending] = useActionState(resetPassword, undefined);
  return (
    <AuthShell scope="s-login" title="Nouveau mot de passe" sub="Choisissez un mot de passe d'au moins 8 caractères." visual={<h2>Presque<br />terminé</h2>}>
      {state?.error && <div className="alert-error" role="alert">{state.error}</div>}
      <form action={action}>
        <input type="hidden" name="token" value={token} />
        <div className="form-group">
          <label htmlFor="password">Nouveau mot de passe</label>
          <div className="input-wrap"><LockIcon /><input id="password" type="password" name="password" minLength={8} required autoComplete="new-password" /></div>
        </div>
        <div className="form-group">
          <label htmlFor="confirm">Confirmer</label>
          <div className="input-wrap"><LockIcon /><input id="confirm" type="password" name="confirm" minLength={8} required autoComplete="new-password" /></div>
        </div>
        <button type="submit" className="btn-submit" disabled={pending}>
          {pending ? <><span className="spinner" /> Enregistrement...</> : 'Enregistrer'}
        </button>
      </form>
    </AuthShell>
  );
}
