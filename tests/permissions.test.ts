import { describe, expect, it } from 'vitest';
import { canManageRestaurant, isAdmin, isStaff, restaurantScope, type Actor } from '@/lib/permissions';

const admin: Actor = { id: 1, role: 'ADMIN', restaurantId: null };
const manager: Actor = { id: 2, role: 'MANAGER', restaurantId: 10 };
const orphanManager: Actor = { id: 3, role: 'MANAGER', restaurantId: null };
const customer: Actor = { id: 4, role: 'CUSTOMER', restaurantId: null };

describe('permissions', () => {
  it('keeps customers out of the back-office', () => {
    expect(isStaff(customer)).toBe(false);
    expect(isStaff(null)).toBe(false);
    expect(isAdmin(manager)).toBe(false);
    expect(isStaff(manager)).toBe(true);
  });

  it('limits managers to their own restaurant', () => {
    expect(canManageRestaurant(manager, 10)).toBe(true);
    expect(canManageRestaurant(manager, 11)).toBe(false);
    expect(canManageRestaurant(admin, 11)).toBe(true);
    expect(canManageRestaurant(customer, 10)).toBe(false);
  });

  it('gives a manager without a restaurant nothing (the old site crashed)', () => {
    expect(canManageRestaurant(orphanManager, 10)).toBe(false);
    expect(restaurantScope(orphanManager)).toBe(-1);
    expect(restaurantScope(admin)).toBeUndefined();
    expect(restaurantScope(manager)).toBe(10);
  });
});
