'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { hasFile, saveUpload, UploadError } from '@/lib/uploads';

export type ApplicationState = { error?: string; fieldErrors?: Record<string, string>; success?: boolean } | undefined;

const schema = z.object({
  lastName: z.string().trim().min(1, 'Le nom est requis').max(100),
  firstName: z.string().trim().min(1, 'Le prénom est requis').max(100),
  email: z.email("Format d'email invalide"),
  phone: z.string().trim().min(8, 'Le téléphone est requis').max(30),
  message: z.string().trim().min(1, 'Le message est requis').max(5000),
});

export async function submitApplication(_prev: ApplicationState, form: FormData): Promise<ApplicationState> {
  const parsed = schema.safeParse(Object.fromEntries(form));
  const cv = form.get('cv');
  const letter = form.get('letter');

  const fieldErrors: Record<string, string> = {};
  if (!parsed.success) for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
  if (!hasFile(cv)) fieldErrors.cv = 'Le CV est requis';
  if (!parsed.success || !hasFile(cv)) return { fieldErrors };

  try {
    const cvFile = await saveUpload(cv, 'document', 'applications', true);
    const letterFile = hasFile(letter) ? await saveUpload(letter, 'document', 'applications', true) : null;
    await db.jobApplication.create({ data: { ...parsed.data, cvFile, letterFile } });
  } catch (e) {
    if (e instanceof UploadError) return { error: e.message };
    throw e;
  }
  return { success: true };
}
