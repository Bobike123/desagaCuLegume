import { browser } from '$app/environment';
import { MAX_CART_QUANTITY } from '$lib/cart-limits';
import { normalizeProductMeasureUnit, normalizeProductPromotionLabel, type ProductMeasureUnit, type ProductPromotionLabel } from '$lib/format';
import { derived, writable } from 'svelte/store';
import type { Product, ProductImage } from '$lib/stores/products';
import { normalizeProductImages } from '$lib/stores/products';

const STORAGE_KEY = 'desaga-cart-v1';

export interface CartLine {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string;
  images: ProductImage[];
  category: string;
  measure_unit: ProductMeasureUnit;
  promotion_label: ProductPromotionLabel;
  in_stock: boolean;
}

type CartState = {
  items: CartLine[];
  hydrated: boolean;
};

function normalizeCartLine(raw: any): CartLine {
  const images = normalizeProductImages(raw?.images, raw?.image_url);

  return {
    productId: String(raw?.productId ?? raw?.product_id ?? ''),
    name: raw?.name ?? 'Produs',
    price: Number(raw?.price ?? raw?.unit_price ?? 0),
    quantity: Number(raw?.quantity ?? 0),
    image_url: images[0]?.url ?? raw?.image_url ?? '',
    images,
    category: raw?.category ?? 'de-sezon',
    measure_unit: normalizeProductMeasureUnit(raw?.measure_unit),
    promotion_label: normalizeProductPromotionLabel(raw?.promotion_label),
    in_stock: Boolean(raw?.in_stock ?? true),
  };
}

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
      const items = raw ? (JSON.parse(raw) as unknown[]).map(normalizeCartLine).filter((item) => item.productId) : [];
      set({ items, hydrated: true });
    },

    replace(items: unknown[]) {
      const normalized = items.map(normalizeCartLine).filter((item) => item.productId);
      persist(normalized);
      set({ items: normalized, hydrated: true });
    },

    addProduct(product: Product, quantity = 1) {
      update((state) => {
        const existing = state.items.find((item) => item.productId === String(product.id));
        const images = normalizeProductImages(product.images, product.image_url);
        let items: CartLine[];

        if (existing) {
          items = state.items.map((item) =>
            item.productId === String(product.id)
              ? {
                  ...item,
                  name: product.name,
                  price: Number(product.price ?? 0),
                  image_url: images[0]?.url ?? product.image_url ?? '',
                  images,
                  category: product.category ?? 'de-sezon',
                  measure_unit: normalizeProductMeasureUnit(product.measure_unit),
                  promotion_label: normalizeProductPromotionLabel(product.promotion_label),
                  in_stock: Boolean(product.in_stock),
                  quantity: Math.min(MAX_CART_QUANTITY, item.quantity + quantity),
                }
              : item
          );
        } else {
          items = [
            ...state.items,
            {
              productId: String(product.id),
              name: product.name,
              price: Number(product.price ?? 0),
              quantity: Math.min(MAX_CART_QUANTITY, Math.max(1, Math.floor(quantity))),
              image_url: images[0]?.url ?? product.image_url ?? '',
              images,
              category: product.category ?? 'de-sezon',
              measure_unit: normalizeProductMeasureUnit(product.measure_unit),
              promotion_label: normalizeProductPromotionLabel(product.promotion_label),
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
        const nextQty = Math.max(0, Math.min(MAX_CART_QUANTITY, Math.floor(quantity)));
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
