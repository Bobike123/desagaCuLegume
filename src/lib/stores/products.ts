// src/lib/stores/products.ts
import { writable } from 'svelte/store';

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image_url: string;
  in_stock: boolean;
  created_at?: string;
  updated_at?: string;
}

type ProductsState = {
  items: Product[];
  loading: boolean;
  error: string | null;
};

const state = writable<ProductsState>({ items: [], loading: false, error: null });

export const productsStore = {
  subscribe: state.subscribe,

  async loadAll(category?: string | null) {
    state.update((s) => ({ ...s, loading: true, error: null }));
    try {
      const qs = category ? `?category=${encodeURIComponent(category)}` : '';
      const res = await fetch(`/api/products${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed to load products');

      state.set({ items: data ?? [], loading: false, error: null });
      return data as Product[];
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      state.set({ items: [], loading: false, error: msg });
      return [];
    }
  },

  async getById(id: string) {
    const res = await fetch(`/api/products/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error ?? 'Failed to load product');
    return data as Product;
  }
};

// Legacy exports used across your pages
export async function getAllProducts(category?: string | null) {
  return productsStore.loadAll(category);
}

export async function getProductById(id: string) {
  return productsStore.getById(id);
}
