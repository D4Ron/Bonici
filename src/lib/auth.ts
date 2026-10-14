import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { isAdmin, isStaff, type Actor } from './permissions';

const COOKIE = 'bonici_session';
const SESSION_DAYS = 30;

export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
export const newToken = (bytes = 32) => randomBytes(bytes).toString('base64url');

export const hashPassword = (password: string) => bcrypt.hash(password, 12);
export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);

export async function createSession(userId: number) {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db.session.create({ data: { id: hashToken(token), userId, expiresAt } });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { id: hashToken(token) } });
  jar.delete(COOKIE);
}

export type CurrentUser = Actor & { name: string; email: string; phone: string | null };

/** The signed-in user for this request, or null. Cached per request. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { id: hashToken(token) },
    include: { user: { select: { id: true, role: true, restaurantId: true, name: true, email: true, phone: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
});

export async function requireUser(returnTo = '/compte'): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return user;
}

export async function requireStaff(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!isStaff(user)) redirect('/login?next=/admin');
  return user as CurrentUser;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireStaff();
  if (!isAdmin(user)) redirect('/admin');
  return user;
}
