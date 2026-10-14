import Link from 'next/link';
import type { ReactNode } from 'react';

export type SearchParams = Promise<Record<string, string | undefined>>;

export function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="header">
      <div>
        <h1>{title}</h1>
        {sub && <div className="sub">{sub}</div>}
      </div>
      {action}
    </div>
  );
}

export function Flash({ sp }: { sp: Record<string, string | undefined> }) {
  if (sp.error) return <div className="alert-error" role="alert">{sp.error}</div>;
  if (sp.ok) return <div className="alert-success" role="status">{sp.ok}</div>;
  return null;
}

export const AddLink = ({ href, children }: { href: string; children: ReactNode }) => (
  <Link href={href} className="btn-add">{children}</Link>
);

export const OnOff = ({ on, yes = 'Oui', no = 'Non' }: { on: boolean; yes?: string; no?: string }) => (
  <span className={`badge ${on ? 'badge-on' : 'badge-off'}`}>{on ? yes : no}</span>
);

/** Image picker with the current image shown. */
export function ImageField({ name = 'image', label = 'Image', current }: { name?: string; label?: string; current?: string | null }) {
  return (
    <label className="full">
      {label}
      <input type="file" name={name} accept="image/jpeg,image/png,image/webp" />
      <span className="hint">JPG, PNG ou WebP, 5 Mo max. Laisser vide pour garder l&apos;image actuelle.</span>
      {current && <img className="preview" src={current} alt="" />}
    </label>
  );
}
