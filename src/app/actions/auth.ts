'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/lib/db';
import {
  createSession, destroySession, hashPassword, hashToken, newToken, verifyPassword,
} from '@/lib/auth';
import { sendMail, siteUrl } from '@/lib/mail';

export type FormState = { error?: string; success?: string } | undefined;

/** Only allow redirects to paths on this site. */
const safeNext = (next: FormDataEntryValue | null, fallback: string) => {
  const n = typeof next === 'string' ? next : '';
  return n.startsWith('/') && !n.startsWith('//') ? n : fallback;
};

export async function login(_prev: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  const password = String(form.get('password') ?? '');
  if (!email || !password) return { error: 'Veuillez remplir tous les champs.' };

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: 'Email ou mot de passe incorrect.' };
  }
  await createSession(user.id);
  const fallback = user.role === 'CUSTOMER' ? '/compte' : '/admin';
  redirect(safeNext(form.get('next'), fallback));
}

const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Indiquez votre nom.').max(120),
    phone: z.string().trim().max(30),
    email: z.email('Adresse email invalide.').transform((e) => e.toLowerCase()),
    password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères.').max(200),
    confirm: z.string(),
    terms: z.literal('on', { error: 'Vous devez accepter les conditions.' }),
  })
  .refine((d) => d.password === d.confirm, { message: 'Les mots de passe ne correspondent pas.' });

export async function register(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, phone, email, password } = parsed.data;

  if (await db.user.findUnique({ where: { email } })) {
    return { error: 'Un compte existe déjà avec cet email.' };
  }
  const user = await db.user.create({
    data: { name, phone: phone || null, email, passwordHash: await hashPassword(password) },
  });
  // Attach past guest orders placed with the same phone number.
  if (phone) {
    await db.order.updateMany({
      where: { userId: null, customerPhone: phone.replace(/[ .-]/g, '') },
      data: { userId: user.id },
    });
  }
  await createSession(user.id);
  redirect(safeNext(form.get('next'), '/compte'));
}

export async function logout() {
  await destroySession();
  redirect('/');
}

export async function requestPasswordReset(_prev: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  const done = { success: 'Si un compte existe avec cet email, un lien de réinitialisation vient de vous être envoyé.' };
  if (!email) return { error: 'Indiquez votre adresse email.' };

  const user = await db.user.findUnique({ where: { email } });
  if (!user) return done; // same answer either way: don't reveal which emails have accounts

  const token = newToken();
  await db.passwordResetToken.create({
    data: { id: hashToken(token), userId: user.id, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
  });
  await sendMail(
    user.email,
    'Réinitialisation de votre mot de passe Bonici',
    `Bonjour ${user.name},\n\nPour choisir un nouveau mot de passe, ouvrez ce lien (valable 1 heure) :\n${siteUrl()}/reinitialiser/${token}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet email.`,
  );
  return done;
}

export async function resetPassword(_prev: FormState, form: FormData): Promise<FormState> {
  const token = String(form.get('token') ?? '');
  const password = String(form.get('password') ?? '');
  if (password.length < 8) return { error: 'Le mot de passe doit contenir au moins 8 caractères.' };
  if (password !== form.get('confirm')) return { error: 'Les mots de passe ne correspondent pas.' };

  const record = await db.passwordResetToken.findUnique({ where: { id: hashToken(token) } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { error: 'Ce lien a expiré. Demandez-en un nouveau.' };
  }
  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { passwordHash: await hashPassword(password) } }),
    db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    db.session.deleteMany({ where: { userId: record.userId } }), // sign out everywhere
  ]);
  await createSession(record.userId);
  redirect('/compte');
}
