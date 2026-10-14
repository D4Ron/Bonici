'use server';

import { revalidatePath } from 'next/cache';
import type { ApplicationStatus, TenderStatus } from '@prisma/client';
import { db } from '@/lib/db';
import { hashPassword, requireAdmin } from '@/lib/auth';
import { deleteUpload, hasFile, saveUpload } from '@/lib/uploads';
import { bool, date, fail, handle, int, optInt, required, str } from '../_lib/form';

const refreshSite = () => revalidatePath('/', 'layout');

// ---- Reviews -------------------------------------------------------------------

export async function toggleReview(id: number) {
  await handle('/admin/avis', async () => {
    await requireAdmin();
    const r = await db.review.findUniqueOrThrow({ where: { id } });
    await db.review.update({ where: { id }, data: { isPublished: !r.isPublished } });
    refreshSite();
  }, 'Avis mis à jour.');
}

export async function addReview(form: FormData) {
  await handle('/admin/avis', async () => {
    await requireAdmin();
    await db.review.create({
      data: {
        source: 'GOOGLE',
        author: required(form, 'author', "L'auteur"),
        rating: int(form, 'rating', { min: 1, max: 5 }),
        text: str(form, 'text'),
        restaurantId: optInt(form, 'restaurantId'),
        publishedAt: date(form, 'publishedAt', 'Date'),
      },
    });
    refreshSite();
  }, 'Avis ajouté.');
}

export async function deleteReview(id: number) {
  await handle('/admin/avis', async () => {
    await requireAdmin();
    await db.review.delete({ where: { id } });
    refreshSite();
  }, 'Avis supprimé.');
}

// ---- News ---------------------------------------------------------------------------

export async function saveNews(id: number | null, form: FormData) {
  await handle(id ? `/admin/actualites/${id}` : '/admin/actualites/nouveau', async () => {
    await requireAdmin();
    const existing = id ? await db.newsPost.findUnique({ where: { id } }) : null;
    const file = form.get('image');
    let image: string | undefined;
    if (hasFile(file)) {
      image = await saveUpload(file, 'image', 'news');
      await deleteUpload(existing?.image);
    }
    const data = {
      title: required(form, 'title', 'Le titre'),
      body: required(form, 'body', 'Le texte'),
      author: str(form, 'author'),
      isPublished: bool(form, 'isPublished'),
      publishedAt: date(form, 'publishedAt', 'Date de publication'),
      ...(image && { image }),
    };
    if (id) await db.newsPost.update({ where: { id }, data });
    else await db.newsPost.create({ data });
    refreshSite();
    return '/admin/actualites';
  });
}

export async function deleteNews(id: number) {
  await handle('/admin/actualites', async () => {
    await requireAdmin();
    const n = await db.newsPost.delete({ where: { id } });
    await deleteUpload(n.image);
    refreshSite();
  }, 'Actualité supprimée.');
}

// ---- Tenders ------------------------------------------------------------------------

const TENDER_STATUSES: TenderStatus[] = ['OPEN', 'IN_PROGRESS', 'CLOSED'];

export async function saveTender(id: number | null, form: FormData) {
  await handle(id ? `/admin/appels-offre/${id}` : '/admin/appels-offre/nouveau', async () => {
    await requireAdmin();
    const existing = id ? await db.tender.findUnique({ where: { id } }) : null;
    const file = form.get('document');
    let document: string | undefined;
    if (hasFile(file)) {
      document = await saveUpload(file, 'document', 'tenders');
      await deleteUpload(existing?.document);
    }
    const status = str(form, 'status') as TenderStatus;
    if (!TENDER_STATUSES.includes(status)) fail('Statut invalide.');
    const data = {
      reference: required(form, 'reference', 'La référence'),
      title: required(form, 'title', 'Le titre'),
      description: required(form, 'description', 'La description'),
      location: required(form, 'location', 'Le lieu'),
      deadline: date(form, 'deadline', 'Date limite'),
      status,
      ...(document && { document }),
    };
    if (id) await db.tender.update({ where: { id }, data });
    else await db.tender.create({ data });
    refreshSite();
    return '/admin/appels-offre';
  });
}

export async function deleteTender(id: number) {
  await handle('/admin/appels-offre', async () => {
    await requireAdmin();
    const t = await db.tender.delete({ where: { id } });
    await deleteUpload(t.document);
    refreshSite();
  }, "Appel d'offre supprimé.");
}

// ---- Job applications ----------------------------------------------------------------

const APP_STATUSES: ApplicationStatus[] = ['NEW', 'REVIEWING', 'INTERVIEW', 'ACCEPTED', 'REJECTED'];

export async function setApplicationStatus(id: number, form: FormData) {
  await handle(`/admin/candidatures/${id}`, async () => {
    await requireAdmin();
    const status = str(form, 'status') as ApplicationStatus;
    if (!APP_STATUSES.includes(status)) fail('Statut invalide.');
    await db.jobApplication.update({ where: { id }, data: { status } });
  }, 'Statut mis à jour.');
}

export async function deleteApplication(id: number) {
  await handle('/admin/candidatures', async () => {
    await requireAdmin();
    const a = await db.jobApplication.delete({ where: { id } });
    await deleteUpload(a.cvFile);
    await deleteUpload(a.letterFile);
    return '/admin/candidatures';
  }, 'Candidature supprimée.');
}

// ---- Users ----------------------------------------------------------------------------

export async function saveUser(id: number | null, form: FormData) {
  await handle(id ? `/admin/utilisateurs/${id}` : '/admin/utilisateurs/nouveau', async () => {
    const me = await requireAdmin();
    const role = str(form, 'role');
    if (!['CUSTOMER', 'MANAGER', 'ADMIN'].includes(role)) fail('Rôle invalide.');
    if (id === me.id && role !== 'ADMIN') fail('Vous ne pouvez pas retirer vos propres droits administrateur.');
    const restaurantId = optInt(form, 'restaurantId');
    if (role === 'MANAGER' && !restaurantId) fail('Un gérant doit être rattaché à un restaurant.');
    const password = str(form, 'password');
    if (!id && password.length < 8) fail('Mot de passe : 8 caractères minimum.');
    if (id && password && password.length < 8) fail('Mot de passe : 8 caractères minimum.');

    const data = {
      name: required(form, 'name', 'Le nom'),
      email: required(form, 'email', "L'email").toLowerCase(),
      phone: str(form, 'phone') || null,
      role: role as 'CUSTOMER' | 'MANAGER' | 'ADMIN',
      restaurantId: role === 'MANAGER' ? restaurantId : null,
      ...(password && { passwordHash: await hashPassword(password) }),
    };
    if (id) {
      await db.user.update({ where: { id }, data });
      if (password) await db.session.deleteMany({ where: { userId: id } });
    } else {
      await db.user.create({ data: { ...data, passwordHash: data.passwordHash! } });
    }
    return '/admin/utilisateurs';
  });
}

export async function deleteUser(id: number) {
  await handle('/admin/utilisateurs', async () => {
    const me = await requireAdmin();
    if (id === me.id) fail('Vous ne pouvez pas supprimer votre propre compte.');
    await db.user.delete({ where: { id } });
  }, 'Utilisateur supprimé.');
}
