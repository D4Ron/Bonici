'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { register } from '@/app/actions/auth';
import { LockIcon, MailIcon, PhoneIcon, UserIcon } from '@/components/auth/AuthShell';
import { Icon } from '@/components/Icon';

const STRENGTH = ['Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort'];

function strengthOf(pwd: string) {
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^a-zA-Z0-9]/.test(pwd)) s++;
  return s;
}

export function RegisterForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(register, undefined);
  const [f, setF] = useState({ name: '', phone: '', email: '', password: '', confirm: '' });
  const [terms, setTerms] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((v) => ({ ...v, [k]: e.target.value }));
  const strength = strengthOf(f.password);

  return (
    <>
      {state?.error && <div className="alert-error" role="alert">{state.error}</div>}
      <form action={action}>
        <input type="hidden" name="next" value={next} />
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="name">Nom complet *</label>
            <div className="input-wrap"><UserIcon /><input id="name" name="name" value={f.name} onChange={set('name')} placeholder="Jean Dupont" required autoComplete="name" /></div>
          </div>
          <div className="form-group">
            <label htmlFor="phone">Téléphone</label>
            <div className="input-wrap"><PhoneIcon /><input id="phone" type="tel" name="phone" value={f.phone} onChange={set('phone')} placeholder="90 00 00 00" autoComplete="tel" /></div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="email">Adresse email *</label>
          <div className="input-wrap"><MailIcon /><input id="email" type="email" name="email" value={f.email} onChange={set('email')} placeholder="votre@email.com" required autoComplete="email" /></div>
        </div>

        <div className="form-group">
          <label htmlFor="password">Mot de passe *</label>
          <div className="input-wrap">
            <LockIcon />
            <input id="password" type={showPwd ? 'text' : 'password'} name="password" value={f.password} onChange={set('password')} placeholder="Min. 8 caractères" required minLength={8} autoComplete="new-password" />
            <button type="button" className="eye-btn" onClick={() => setShowPwd((v) => !v)} aria-label="Afficher le mot de passe"><Icon name={showPwd ? 'eyeOff' : 'eye'} /></button>
          </div>
          <div className="strength-wrap">
            <div className="strength-bar"><div className={`strength-fill s${strength}`} style={{ width: `${strength * 25}%` }} /></div>
            <span className="strength-lbl">{STRENGTH[strength]}</span>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="confirm">Confirmer le mot de passe *</label>
          <div className="input-wrap"><LockIcon /><input id="confirm" type={showPwd ? 'text' : 'password'} name="confirm" value={f.confirm} onChange={set('confirm')} placeholder="Confirmez le mot de passe" required autoComplete="new-password" /></div>
        </div>

        <label className="terms-label">
          <input type="checkbox" name="terms" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
          J&apos;accepte les <Link href="/cgu">CGU</Link> et la <Link href="/confidentialite">politique de confidentialité</Link>
        </label>

        <button type="submit" className="btn-submit" disabled={pending || !terms}>
          {pending ? <><span className="spinner" /> Création en cours...</> : 'Créer mon compte'}
        </button>
      </form>
      <p className="switch">Déjà un compte ? <Link href="/login">Se connecter</Link></p>
    </>
  );
}
