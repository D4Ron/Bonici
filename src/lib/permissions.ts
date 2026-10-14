// Pure access rules, shared by pages and server actions.

export type Role = 'CUSTOMER' | 'MANAGER' | 'ADMIN';

export interface Actor {
  id: number;
  role: Role;
  restaurantId: number | null;
}

export const isStaff = (u: Actor | null): u is Actor => !!u && (u.role === 'ADMIN' || u.role === 'MANAGER');
export const isAdmin = (u: Actor | null): u is Actor => !!u && u.role === 'ADMIN';

/** Admins manage every restaurant; a manager only the one assigned to them. */
export function canManageRestaurant(u: Actor | null, restaurantId: number): boolean {
  if (!u) return false;
  if (u.role === 'ADMIN') return true;
  return u.role === 'MANAGER' && u.restaurantId !== null && u.restaurantId === restaurantId;
}

/** Restaurant filter for staff queries: undefined = all restaurants. */
export function restaurantScope(u: Actor): number | undefined {
  if (u.role === 'ADMIN') return undefined;
  return u.restaurantId ?? -1; // a manager without a restaurant sees nothing
}
