// FILE: src/lib/stores/products.ts

import { writable } from "svelte/store";

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

const store = writable<ProductsState>({
  items: [],
  loading: false,
  error: null,
});

function toBool(v: unknown): boolean {
  return v === true || v === 1 || v === "true" || v === "1";
}

function normalizeProduct(raw: any): Product {
  return {
    id: raw?.id != null ? String(raw.id) : "",
    name: raw?.name ?? "",
    description: raw?.description ?? "",
    category: raw?.category ?? "de-sezon",
    price: typeof raw?.price === "number" ? raw.price : Number(raw?.price ?? 0),
    image_url: raw?.image_url ?? "",
    in_stock: toBool(raw?.in_stock),
    created_at: raw?.created_at ?? undefined,
    updated_at: raw?.updated_at ?? undefined,
  };
}

export const productsStore = {
  subscribe: store.subscribe,

  async loadAll(category?: string | null) {
    store.update((s) => ({ ...s, loading: true, error: null }));
    try {
      const qs = category ? `?category=${encodeURIComponent(category)}` : "";
      const res = await fetch(`/api/products${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to load products");

      const normalized = (Array.isArray(data) ? data : []).map(normalizeProduct);
      store.set({ items: normalized, loading: false, error: null });
      return normalized;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      store.set({ items: [], loading: false, error: msg });
      return [];
    }
  },

  async getById(id: string) {
    const res = await fetch(`/api/products/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error ?? "Failed to load product");

    // API returns { item: ... } in this project
    const raw = data && typeof data === "object" && "item" in data ? (data as any).item : data;
    return normalizeProduct(raw) as Product;
  },
};

// Legacy exports used across your pages
export async function getAllProducts(category?: string | null) {
  return productsStore.loadAll(category);
}

export async function getProductById(id: string) {
  return productsStore.getById(id);
}
