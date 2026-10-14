// Guests have no account, so the browser remembers their tracking links.
const KEY = 'bonici_recent_orders';

export interface RecentOrder { token: string; id: number; placedAt: string; restaurant: string }

export function readRecentOrders(): RecentOrder[] {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function rememberOrder(order: RecentOrder) {
  try {
    const list = [order, ...readRecentOrders().filter((o) => o.token !== order.token)].slice(0, 10);
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch { /* storage blocked: the confirmation page still shows the link */ }
}
