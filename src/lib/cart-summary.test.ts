import { describe, expect, it } from 'vitest';
import { computeCartSummary, DELIVERY_FEE, FREE_DELIVERY_THRESHOLD } from './cart-summary';

const lines = (subtotal: number, itemCount = 1) => [{ price: subtotal, quantity: itemCount }];

describe('computeCartSummary', () => {
  it('pins the shipping rule to the values charged by the place_order RPC', () => {
    // The authoritative rule lives in SQL (place_order,
    // supabase/migrations/20260702_03_orders_delivery_and_transitions.sql):
    // free delivery at subtotal >= 150 RON, otherwise a flat 20 RON fee.
    // If this test fails you changed the display rule without changing what
    // customers are actually charged — update both together.
    expect(FREE_DELIVERY_THRESHOLD).toBe(150);
    expect(DELIVERY_FEE).toBe(20);
  });

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

  it('applies server-provided shipping rules over the compiled defaults', () => {
    const rules = { freeDeliveryThreshold: 200, deliveryFee: 25 };
    const below = computeCartSummary(lines(180), 'delivery', rules);
    expect(below.shippingFee).toBe(25);
    expect(below.remainingForFreeDelivery).toBe(20);

    const above = computeCartSummary(lines(200), 'delivery', rules);
    expect(above.shippingFee).toBe(0);
  });
});
