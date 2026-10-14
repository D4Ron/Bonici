'use client';

import type { ReactNode } from 'react';
import { useFormStatus } from 'react-dom';

/** Submit button that asks for confirmation first (for deletions and irreversible status changes). */
export function ConfirmButton({ message, className = 'btn-danger', children }: { message: string; className?: string; children: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} onClick={(e) => { if (!confirm(message)) e.preventDefault(); }}>
      {pending ? '…' : children}
    </button>
  );
}

export function SubmitButton({ className = 'btn-save', children }: { className?: string; children: ReactNode }) {
  const { pending } = useFormStatus();
  return <button type="submit" className={className} disabled={pending}>{pending ? 'Enregistrement…' : children}</button>;
}
