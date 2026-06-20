import { writable } from 'svelte/store';

export interface Product {
  id: string;
  sku?: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image_url: string;
  in_stock: boolean;
  stock_quantity?: number;
  status?: string;
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
  return v === true || v === 1 || v === 'true' || v === '1';
}

function normalizeProduct(raw: any): Product {
  return {
    id: raw?.id != null ? String(raw.id) : '',
    sku: raw?.sku ?? undefined,
    name: raw?.name ?? '',
    description: raw?.description ?? '',
    category: raw?.category ?? 'de-sezon',
    price: typeof raw?.price === 'number' ? raw.price : Number(raw?.price ?? 0),
    image_url: raw?.image_url ?? '',
    in_stock: toBool(raw?.in_stock),
    stock_quantity:
      typeof raw?.stock_quantity === 'number'
        ? raw.stock_quantity
        : Number(raw?.stock_quantity ?? 0),
    status: raw?.status ?? undefined,
    created_at: raw?.created_at ?? undefined,
    updated_at: raw?.updated_at ?? undefined,
  };
}

export const productsStore = {
  subscribe: store.subscribe,

  async loadAll(category?: string | null) {
    store.update((state) => ({ ...state, loading: true, error: null }));
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (category) params.set('category', category);
      const qs = `?${params.toString()}`;
      const res = await fetch(`/api/products${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Nu am putut încărca produsele.');

      const normalized = (Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []).map(normalizeProduct);
      store.set({ items: normalized, loading: false, error: null });
      return normalized;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Eroare necunoscută.';
      store.set({ items: [], loading: false, error: msg });
      return [];
    }
  },

  async getById(id: string) {
    const res = await fetch(`/api/products/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error ?? 'Nu am putut încărca produsul.');

    const raw = data && typeof data === 'object' && 'item' in data ? (data as any).item : data;
    return normalizeProduct(raw) as Product;
  },
};

export async function getAllProducts(category?: string | null) {
  return productsStore.loadAll(category);
}
