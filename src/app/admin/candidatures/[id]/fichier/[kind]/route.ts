import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isAdmin } from '@/lib/permissions';
import { safeJoin } from '@/lib/uploads';

const TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

// CVs are private: only admins can download them.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string; kind: string }> }) {
  if (!isAdmin(await getCurrentUser())) return new Response('Forbidden', { status: 403 });
  const { id, kind } = await params;
  const app = await db.jobApplication.findUnique({ where: { id: Number(id) || 0 } });
  const rel = kind === 'cv' ? app?.cvFile : kind === 'lettre' ? app?.letterFile : null;
  if (!app || !rel) return new Response('Not found', { status: 404 });

  const ext = extname(rel).toLowerCase();
  const name = `${kind}-${app.lastName}-${app.firstName}${ext}`.replace(/[^\w.-]+/g, '_');
  try {
    const body = await readFile(safeJoin(rel));
    return new Response(new Uint8Array(body), {
      headers: {
        'Content-Type': TYPES[ext] ?? 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${name}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
