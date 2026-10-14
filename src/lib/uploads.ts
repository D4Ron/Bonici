import 'server-only';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import { randomBytes } from 'node:crypto';

// Public files (photos, tender documents) are served from /uploads/<path>.
// Private files (CVs) live under private/ and are only streamed to admins.
export const uploadRoot = resolve(process.env.UPLOAD_DIR ?? './uploads');

const KINDS = {
  image: {
    maxBytes: 5 * 1024 * 1024,
    types: { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } as Record<string, string>,
    label: 'une image JPG, PNG ou WebP',
  },
  document: {
    maxBytes: 10 * 1024 * 1024,
    types: {
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    } as Record<string, string>,
    label: 'un fichier PDF, DOC ou DOCX',
  },
};

export class UploadError extends Error {
  override name = 'UploadError';
}

/** Returns true when the form field actually contains a file. */
export const hasFile = (f: FormDataEntryValue | null): f is File => f instanceof File && f.size > 0;

/**
 * Saves an uploaded file and returns its stored path (relative to the upload root),
 * e.g. "public/dishes/k3j2…​.jpg".
 */
export async function saveUpload(file: File, kind: keyof typeof KINDS, folder: string, isPrivate = false): Promise<string> {
  const rule = KINDS[kind];
  const ext = rule.types[file.type];
  if (!ext) throw new UploadError(`Format refusé : envoyez ${rule.label}.`);
  if (file.size > rule.maxBytes) throw new UploadError(`Fichier trop lourd (max ${rule.maxBytes / 1024 / 1024} Mo).`);

  const rel = [isPrivate ? 'private' : 'public', folder, `${randomBytes(12).toString('hex')}.${ext}`].join('/');
  const abs = safeJoin(rel);
  await mkdir(join(abs, '..'), { recursive: true });
  await writeFile(abs, Buffer.from(await file.arrayBuffer()));
  return rel;
}

export async function deleteUpload(rel: string | null | undefined) {
  if (!rel || !rel.startsWith('public/') && !rel.startsWith('private/')) return;
  await unlink(safeJoin(rel)).catch(() => {});
}

/** Resolves a stored path inside the upload root, refusing anything that escapes it. */
export function safeJoin(rel: string): string {
  const abs = resolve(uploadRoot, rel);
  if (!abs.startsWith(uploadRoot + sep)) throw new UploadError('Chemin invalide.');
  return abs;
}

/** URL for a stored public file; seeded images under /images are returned as-is. */
export function publicUrl(rel: string | null | undefined): string | null {
  if (!rel) return null;
  if (rel.startsWith('/')) return rel;
  if (rel.startsWith('public/')) return `/uploads/${rel.slice('public/'.length)}`;
  return null;
}
