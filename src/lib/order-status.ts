import type { FulfillmentMode } from './pricing';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED';

const FLOW: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'REJECTED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['OUT_FOR_DELIVERY', 'COMPLETED'],
  OUT_FOR_DELIVERY: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
  REJECTED: [],
};

/** Statuses staff can move an order to next. */
export function nextStatuses(from: OrderStatus, mode: FulfillmentMode): OrderStatus[] {
  return FLOW[from].filter((to) => {
    // Takeaway orders are handed over at the counter; delivery orders go out first.
    if (from === 'READY' && to === 'OUT_FOR_DELIVERY') return mode === 'DELIVERY';
    if (from === 'READY' && to === 'COMPLETED') return mode === 'TAKEAWAY';
    return true;
  });
}

export function canTransition(from: OrderStatus, to: OrderStatus, mode: FulfillmentMode): boolean {
  return nextStatuses(from, mode).includes(to);
}

/** Customers can only cancel before the restaurant has accepted the order. */
export const customerCanCancel = (status: OrderStatus) => status === 'PENDING';

export const isFinal = (status: OrderStatus) => FLOW[status].length === 0;

export function statusLabel(status: OrderStatus, mode: FulfillmentMode): string {
  switch (status) {
    case 'PENDING': return 'Reçue';
    case 'CONFIRMED': return 'Confirmée';
    case 'PREPARING': return 'En préparation';
    case 'READY': return mode === 'DELIVERY' ? 'Prête' : 'Prête à récupérer';
    case 'OUT_FOR_DELIVERY': return 'En livraison';
    case 'COMPLETED': return mode === 'DELIVERY' ? 'Livrée' : 'Récupérée';
    case 'CANCELLED': return 'Annulée';
    case 'REJECTED': return 'Refusée';
  }
}

/** Label for the button that moves an order to `to`. */
export function actionLabel(to: OrderStatus, mode: FulfillmentMode): string {
  switch (to) {
    case 'CONFIRMED': return 'Accepter';
    case 'REJECTED': return 'Refuser';
    case 'CANCELLED': return 'Annuler';
    case 'PREPARING': return 'Lancer la préparation';
    case 'READY': return 'Marquer prête';
    case 'OUT_FOR_DELIVERY': return 'Remettre au livreur';
    case 'COMPLETED': return mode === 'DELIVERY' ? 'Marquer livrée' : 'Marquer récupérée';
    default: return statusLabel(to, mode);
  }
}

/** The happy-path steps shown on the tracking page. */
export function trackingSteps(mode: FulfillmentMode): OrderStatus[] {
  return mode === 'DELIVERY'
    ? ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'COMPLETED']
    : ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED'];
}
