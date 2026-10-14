import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { saveUser } from '../../_actions/content';
import { Flash, PageHeader, type SearchParams } from '../../_components/ui';
import { SubmitButton } from '../../_components/ConfirmButton';

export default async function UserForm({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SearchParams }) {
  await requireAdmin();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const isNew = id === 'nouveau';
  const [u, restaurants] = await Promise.all([
    isNew ? null : db.user.findUnique({ where: { id: Number(id) || 0 } }),
    db.restaurant.findMany({ orderBy: { position: 'asc' } }),
  ]);
  if (!isNew && !u) notFound();

  return (
    <>
      <PageHeader title={u ? u.name : 'Nouvel utilisateur'} />
      <Flash sp={sp} />
      <form className="admin-form" action={saveUser.bind(null, u?.id ?? null)}>
        <div className="grid">
          <label>Nom *<input name="name" defaultValue={u?.name} required /></label>
          <label>Email *<input name="email" type="email" defaultValue={u?.email} required /></label>
          <label>Téléphone<input name="phone" defaultValue={u?.phone ?? ''} /></label>
          <label>Rôle
            <select name="role" defaultValue={u?.role ?? 'MANAGER'}>
              <option value="MANAGER">Gérant de restaurant</option>
              <option value="ADMIN">Administrateur</option>
              <option value="CUSTOMER">Client</option>
            </select>
          </label>
          <label>Restaurant (gérants)
            <select name="restaurantId" defaultValue={u?.restaurantId ?? ''}>
              <option value="">—</option>
              {restaurants.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </label>
          <label>{isNew ? 'Mot de passe *' : 'Nouveau mot de passe'}
            <input name="password" type="password" minLength={8} required={isNew} autoComplete="new-password" />
            <span className="hint">{isNew ? '8 caractères minimum.' : 'Laisser vide pour ne pas le changer.'}</span>
          </label>
        </div>
        <div className="actions">
          <SubmitButton>Enregistrer</SubmitButton>
          <Link href="/admin/utilisateurs" className="btn-ghost">Annuler</Link>
        </div>
      </form>
    </>
  );
}
