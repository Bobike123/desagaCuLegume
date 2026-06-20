import { get } from 'svelte/store';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('$lib/cart-limits', () => ({ MAX_CART_QUANTITY: 99 }));

const storageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

vi.stubGlobal('window', { localStorage: storageMock });
vi.stubGlobal('localStorage', storageMock);

const { cart } = await import('./cart');

const PRODUCT = {
  id: 'p1',
  name: 'Roșii cherry',
  description: '',
  category: 'de-sezon',
  price: 8.5,
  image_url: '',
  in_stock: true,
};

beforeEach(() => {
  storageMock.clear();
  cart.clear();
});

describe('cart browser persistence', () => {
  it('replace() persists items to localStorage', () => {
    const lines = [{ productId: 'p1', name: 'Roșii', price: 8.5, quantity: 2, image_url: '', category: 'de-sezon', in_stock: true }];
    cart.replace(lines);
    const stored = storageMock.getItem('desaga-cart-v1');
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored!)).toHaveLength(1);
    expect(JSON.parse(stored!)[0].productId).toBe('p1');
  });

  it('hydrate() reads items from localStorage', () => {
    const lines = [{ productId: 'p2', name: 'Morcovi', price: 5, quantity: 1, image_url: '', category: 'de-sezon', in_stock: true }];
    storageMock.setItem('desaga-cart-v1', JSON.stringify(lines));
    cart.hydrate();
    const state = get(cart);
    expect(state.items).toHaveLength(1);
    expect(state.items[0].productId).toBe('p2');
    expect(state.hydrated).toBe(true);
  });

  it('hydrate() sets hydrated=true even when localStorage is empty', () => {
    cart.hydrate();
    const state = get(cart);
    expect(state.items).toHaveLength(0);
    expect(state.hydrated).toBe(true);
  });
});
