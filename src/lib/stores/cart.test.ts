import { get } from 'svelte/store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/environment', () => ({ browser: false }));

const { cart, cartCount } = await import('./cart');

const PRODUCT = {
  id: 'p1',
  name: 'Roșii cherry',
  description: 'Roșii mici',
  category: 'legume',
  price: 8.5,
  image_url: '',
  in_stock: true,
};

beforeEach(() => {
  cart.clear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('cart store', () => {
  it('starts empty', () => {
    const state = get(cart);
    expect(state.items).toHaveLength(0);
  });

  it('adds a product', () => {
    cart.addProduct(PRODUCT, 1);
    const { items } = get(cart);
    expect(items).toHaveLength(1);
    expect(items[0].productId).toBe('p1');
    expect(items[0].quantity).toBe(1);
  });

  it('increments quantity when the same product is added again', () => {
    cart.addProduct(PRODUCT, 1);
    cart.addProduct(PRODUCT, 2);
    const { items } = get(cart);
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(3);
  });

  it('decrements quantity with setQuantity', () => {
    cart.addProduct(PRODUCT, 3);
    cart.setQuantity('p1', 1);
    expect(get(cart).items[0].quantity).toBe(1);
  });

  it('removes item when setQuantity reaches 0', () => {
    cart.addProduct(PRODUCT, 1);
    cart.setQuantity('p1', 0);
    expect(get(cart).items).toHaveLength(0);
  });

  it('removes a specific item', () => {
    const p2 = { ...PRODUCT, id: 'p2', name: 'Morcovi' };
    cart.addProduct(PRODUCT, 1);
    cart.addProduct(p2, 2);
    cart.remove('p1');
    const { items } = get(cart);
    expect(items).toHaveLength(1);
    expect(items[0].productId).toBe('p2');
  });

  it('clears all items', () => {
    cart.addProduct(PRODUCT, 5);
    cart.clear();
    expect(get(cart).items).toHaveLength(0);
  });

  it('enforces MAX_CART_QUANTITY on addProduct', () => {
    cart.addProduct(PRODUCT, 100);
    expect(get(cart).items[0].quantity).toBe(99);
  });

  it('clamps addProduct when incrementing above MAX_CART_QUANTITY', () => {
    cart.addProduct(PRODUCT, 98);
    cart.addProduct(PRODUCT, 10);
    expect(get(cart).items[0].quantity).toBe(99);
  });

  it('clamps setQuantity to MAX_CART_QUANTITY', () => {
    cart.addProduct(PRODUCT, 1);
    cart.setQuantity('p1', 200);
    expect(get(cart).items[0].quantity).toBe(99);
  });

  it('ignores fractional quantities (floors to integer)', () => {
    cart.addProduct(PRODUCT, 1);
    cart.setQuantity('p1', 2.9);
    expect(get(cart).items[0].quantity).toBe(2);
  });

  it('does not go below 0 with setQuantity', () => {
    cart.addProduct(PRODUCT, 1);
    cart.setQuantity('p1', -5);
    expect(get(cart).items).toHaveLength(0);
  });

  it('cartCount reflects total quantity', () => {
    cart.addProduct(PRODUCT, 3);
    cart.addProduct({ ...PRODUCT, id: 'p2' }, 2);
    expect(get(cartCount)).toBe(5);
  });

  it('cartCount returns 0 after clear', () => {
    cart.addProduct(PRODUCT, 3);
    cart.clear();
    expect(get(cartCount)).toBe(0);
  });

  it('does not add out-of-stock product guard is outside store (store accepts any)', () => {
    const outOfStock = { ...PRODUCT, in_stock: false };
    cart.addProduct(outOfStock, 1);
    expect(get(cart).items[0].in_stock).toBe(false);
  });

  it('normalizes product id to string', () => {
    cart.addProduct({ ...PRODUCT, id: 42 as unknown as string }, 1);
    expect(get(cart).items[0].productId).toBe('42');
  });
});
