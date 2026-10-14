import Link from 'next/link';
import type { ReactNode } from 'react';

/** Two-column auth layout from the old login/register pages. */
export function AuthShell({ scope, visual, title, sub, children }: {
  scope: 's-login' | 's-register';
  visual: ReactNode;
  title: string;
  sub: string;
  children: ReactNode;
}) {
  return (
    <div className={scope}>
      <div className="auth-page">
        <div className="auth-visual">
          <div className="visual-inner">
            <div className="logo">
              <Link href="/" className="logo"><img src="/images/logo-bonici.png" alt="Bonici Africa" style={{ height: 300 }} /></Link>
            </div>
            {visual}
          </div>
        </div>

        <div className="auth-form">
          <div className="auth-card page-enter">
            <Link href="/" className="back-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
              Retour à l&apos;accueil
            </Link>
            <h1>{title}</h1>
            <p className="sub">{sub}</p>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
);
export const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
);
export const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);
export const PhoneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l.95-.95a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
);
