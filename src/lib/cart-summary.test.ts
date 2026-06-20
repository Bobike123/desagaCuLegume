import { describe, expect, it } from 'vitest';
import { computeCartSummary, DELIVERY_FEE, FREE_DELIVERY_THRESHOLD } from './cart-summary';

const lines = (subtotal: number, itemCount = 1) => [{ price: subtotal, quantity: itemCount }];

describe('computeCartSummary', () => {
  it('sums item count and subtotal across lines', () => {
    const s = computeCartSummary(
      [
        { price: 10, quantity: 2 },
        { price: 5, quantity: 3 },
      ],
      'pickup'
    );
    expect(s.itemCount).toBe(5);
    expect(s.subtotal).toBe(35);
  });

  it('charges no shipping for pickup', () => {
    const s = computeCartSummary(lines(100), 'pickup');
    expect(s.shippingFee).toBe(0);
    expect(s.total).toBe(100);
  });

  it('charges the flat fee for delivery below the free threshold', () => {
    const s = computeCartSummary(lines(100), 'delivery');
    expect(s.shippingFee).toBe(DELIVERY_FEE);
    expect(s.total).toBe(100 + DELIVERY_FEE);
    expect(s.remainingForFreeDelivery).toBe(FREE_DELIVERY_THRESHOLD - 100);
  });

  it('gives free delivery at or above the threshold', () => {
    expect(computeCartSummary(lines(FREE_DELIVERY_THRESHOLD), 'delivery').shippingFee).toBe(0);
    expect(computeCartSummary(lines(200), 'delivery').shippingFee).toBe(0);
    expect(computeCartSummary(lines(200), 'delivery').remainingForFreeDelivery).toBe(0);
  });

  it('charges no delivery fee for an empty cart', () => {
    const s = computeCartSummary([], 'delivery');
    expect(s.subtotal).toBe(0);
    expect(s.shippingFee).toBe(0);
    expect(s.total).toBe(0);
    expect(s.remainingForFreeDelivery).toBe(FREE_DELIVERY_THRESHOLD);
  });
});
