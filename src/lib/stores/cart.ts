import { browser } from '$app/environment';
import { derived, writable } from 'svelte/store';
import type { Product } from '$lib/stores/products';

const STORAGE_KEY = 'desaga-cart-v1';

export interface CartLine {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string;
  category: string;
  in_stock: boolean;
}

type CartState = {
  items: CartLine[];
  hydrated: boolean;
};

function createCartStore() {
  const { subscribe, set, update } = writable<CartState>({
    items: [],
    hydrated: false,
  });

  function persist(items: CartLine[]) {
    if (!browser) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  return {
    subscribe,

    hydrate() {
      if (!browser) return;
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const items = raw ? (JSON.parse(raw) as CartLine[]) : [];
      set({ items, hydrated: true });
    },

    replace(items: CartLine[]) {
      persist(items);
      set({ items, hydrated: true });
    },

    addProduct(product: Product, quantity = 1) {
      update((state) => {
        const existing = state.items.find((item) => item.productId === String(product.id));
        let items: CartLine[];

        if (existing) {
          items = state.items.map((item) =>
            item.productId === String(product.id)
              ? { ...item, quantity: Math.min(999, item.quantity + quantity) }
              : item
          );
        } else {
          items = [
            ...state.items,
            {
              productId: String(product.id),
              name: product.name,
              price: Number(product.price ?? 0),
              quantity,
              image_url: product.image_url ?? '',
              category: product.category ?? 'de-sezon',
              in_stock: Boolean(product.in_stock),
            },
          ];
        }

        persist(items);
        return { ...state, items, hydrated: true };
      });
    },

    setQuantity(productId: string, quantity: number) {
      update((state) => {
        const nextQty = Math.max(0, Math.min(999, Math.floor(quantity)));
        const items =
          nextQty === 0
            ? state.items.filter((item) => item.productId !== productId)
            : state.items.map((item) =>
                item.productId === productId ? { ...item, quantity: nextQty } : item
              );

        persist(items);
        return { ...state, items, hydrated: true };
      });
    },

    remove(productId: string) {
      update((state) => {
        const items = state.items.filter((item) => item.productId !== productId);
        persist(items);
        return { ...state, items, hydrated: true };
      });
    },

    clear() {
      persist([]);
      set({ items: [], hydrated: true });
    },
  };
}

export const cart = createCartStore();
export const cartCount = derived(cart, ($cart) =>
  $cart.items.reduce((sum, item) => sum + item.quantity, 0)
);
export const cartSubtotal = derived(cart, ($cart) =>
  $cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
);
