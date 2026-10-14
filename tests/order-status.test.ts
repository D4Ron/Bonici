import { describe, expect, it } from 'vitest';
import { canTransition, customerCanCancel, isFinal, nextStatuses, trackingSteps } from '@/lib/order-status';

describe('order status flow', () => {
  it('follows the kitchen flow forward only', () => {
    expect(canTransition('PENDING', 'CONFIRMED', 'DELIVERY')).toBe(true);
    expect(canTransition('CONFIRMED', 'PREPARING', 'DELIVERY')).toBe(true);
    expect(canTransition('COMPLETED', 'PENDING', 'DELIVERY')).toBe(false); // the old site allowed this
    expect(canTransition('PENDING', 'COMPLETED', 'DELIVERY')).toBe(false);
  });

  it('sends delivery orders out before completing them', () => {
    expect(nextStatuses('READY', 'DELIVERY')).toEqual(['OUT_FOR_DELIVERY']);
    expect(nextStatuses('READY', 'TAKEAWAY')).toEqual(['COMPLETED']);
  });

  it('only lets customers cancel before the restaurant accepts', () => {
    expect(customerCanCancel('PENDING')).toBe(true);
    expect(customerCanCancel('CONFIRMED')).toBe(false);
    expect(customerCanCancel('PREPARING')).toBe(false);
  });

  it('treats completed, cancelled and refused orders as final', () => {
    for (const s of ['COMPLETED', 'CANCELLED', 'REJECTED'] as const) expect(isFinal(s)).toBe(true);
    expect(isFinal('READY')).toBe(false);
  });

  it('shows the right tracking steps per mode', () => {
    expect(trackingSteps('TAKEAWAY')).not.toContain('OUT_FOR_DELIVERY');
    expect(trackingSteps('DELIVERY')).toContain('OUT_FOR_DELIVERY');
  });
});
