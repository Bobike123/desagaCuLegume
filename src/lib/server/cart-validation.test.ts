import { describe, expect, it, vi } from 'vitest';

vi.mock('$lib/cart-limits', () => ({ MAX_CART_QUANTITY: 99 }));

const { normalizeCartItems } = await import('./cart-validation');

describe('normalizeCartItems', () => {
  it('normalizes a single valid item', () => {
    const result = normalizeCartItems([{ productId: '5', quantity: 2 }]);
    expect(result).toEqual([{ productId: '5', quantity: 2 }]);
  });

  it('deduplicates items with the same productId by summing quantities', () => {
    const result = normalizeCartItems([
      { productId: '3', quantity: 2 },
      { productId: '3', quantity: 5 },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ productId: '3', quantity: 7 });
  });

  it('caps quantity at MAX_CART_QUANTITY after summing', () => {
    const result = normalizeCartItems([
      { productId: '1', quantity: 60 },
      { productId: '1', quantity: 60 },
    ]);
    expect(result[0].quantity).toBe(99);
  });

  it('keeps multiple distinct items', () => {
    const result = normalizeCartItems([
      { productId: '1', quantity: 1 },
      { productId: '2', quantity: 3 },
    ]);
    expect(result).toHaveLength(2);
  });

  it('throws RequestValidationError for non-object items', () => {
    expect(() => normalizeCartItems([null])).toThrow('Produs invalid în coș la poziția 1.');
    expect(() => normalizeCartItems(['string'])).toThrow('Produs invalid în coș la poziția 1.');
    expect(() => normalizeCartItems([42])).toThrow('Produs invalid în coș la poziția 1.');
  });

  it('throws for missing productId', () => {
    expect(() => normalizeCartItems([{ quantity: 2 }])).toThrow();
  });

  it('throws for quantity below minimum', () => {
    expect(() => normalizeCartItems([{ productId: '1', quantity: 0 }])).toThrow();
  });

  it('throws for non-integer quantity', () => {
    expect(() => normalizeCartItems([{ productId: '1', quantity: 1.5 }])).toThrow();
  });

  it('returns empty array for empty input', () => {
    expect(normalizeCartItems([])).toEqual([]);
  });

  it('coerces numeric productId strings correctly', () => {
    const result = normalizeCartItems([{ productId: '007', quantity: 1 }]);
    expect(result[0].productId).toBe('007');
  });

  it('includes item index in error message for third item', () => {
    expect(() =>
      normalizeCartItems([
        { productId: '1', quantity: 1 },
        { productId: '2', quantity: 1 },
        'bad',
      ])
    ).toThrow('Produs invalid în coș la poziția 3.');
  });
});
