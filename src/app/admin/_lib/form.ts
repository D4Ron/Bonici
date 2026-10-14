import 'server-only';
import { redirect } from 'next/navigation';

// Small helpers for the back-office forms (plain <form action> + redirect with a flash message).

export const str = (f: FormData, k: string) => String(f.get(k) ?? '').trim();
export const bool = (f: FormData, k: string) => f.get(k) === 'on';

export function int(f: FormData, k: string, { min = 0, max = 100_000_000 } = {}): number {
  const n = Number(str(f, k));
  if (!Number.isInteger(n) || n < min || n > max) fail(`Valeur invalide pour « ${k} ».`);
  return n;
}

export function optInt(f: FormData, k: string): number | null {
  const v = str(f, k);
  if (!v) return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0) fail(`Valeur invalide pour « ${k} ».`);
  return n;
}

export function required(f: FormData, k: string, label: string): string {
  const v = str(f, k);
  if (!v) fail(`${label} est obligatoire.`);
  return v;
}

export function date(f: FormData, k: string, label: string): Date {
  const d = new Date(str(f, k));
  if (Number.isNaN(d.getTime())) fail(`${label} : date invalide.`);
  return d;
}

/** Thrown inside actions; caught by `handle` and turned into ?error=. */
export class FormError extends Error {}
export function fail(message: string): never {
  throw new FormError(message);
}

/** Runs an action body and redirects back with a flash message either way. */
export async function handle(back: string, body: () => Promise<string | void>, okMessage = 'Enregistré.') {
  let target: string;
  try {
    const result = await body();
    target = `${result ?? back}${(result ?? back).includes('?') ? '&' : '?'}ok=${encodeURIComponent(okMessage)}`;
  } catch (e) {
    if (!(e instanceof FormError) && !(e instanceof Error && e.name === 'UploadError')) {
      if (isUniqueViolation(e)) {
        target = `${back}?error=${encodeURIComponent('Cette valeur existe déjà (doublon).')}`;
        redirect(target);
      }
      throw e;
    }
    target = `${back}?error=${encodeURIComponent(e.message)}`;
  }
  redirect(target);
}

const isUniqueViolation = (e: unknown) => typeof e === 'object' && e !== null && (e as { code?: string }).code === 'P2002';

/** <input type="datetime-local"> value in Lomé time (UTC+0). */
export const toLocalInput = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 16) : '');
