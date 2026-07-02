import { get, writable } from 'svelte/store';
import { apiFetch } from '$lib/api-client';
import {
  isPromotedProduct,
  normalizeProductMeasureUnit,
  normalizeProductPromotionLabel,
  type ProductMeasureUnit,
  type ProductPromotionLabel,
} from '$lib/format';

export interface ProductImage {
  id?: string;
  url: string;
  alt_text?: string;
  sort_order?: number;
  is_primary?: boolean;
}

export interface Product {
  id: string;
  sku?: string;
  name: string;
  description: string;
  category: string;
  price: number;
  measure_unit?: ProductMeasureUnit;
  promotion_label?: ProductPromotionLabel;
  image_url: string;
  images?: ProductImage[];
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

function imageUrlFromRaw(raw: any): string {
  if (typeof raw === 'string') return raw.trim();
  return String(raw?.url ?? raw?.image_url ?? '').trim();
}

export function normalizeProductImages(rawImages: unknown, fallbackUrl?: unknown): ProductImage[] {
  const seen = new Set<string>();
  const images: ProductImage[] = [];

  if (Array.isArray(rawImages)) {
    rawImages.forEach((raw, index) => {
      const url = imageUrlFromRaw(raw);
      if (!url || seen.has(url)) return;
      seen.add(url);
      images.push({
        id: raw && typeof raw === 'object' && 'id' in raw ? String((raw as any).id) : undefined,
        url,
        alt_text: raw && typeof raw === 'object' ? String((raw as any).alt_text ?? '').trim() || undefined : undefined,
        sort_order:
          raw && typeof raw === 'object' && Number.isFinite(Number((raw as any).sort_order))
            ? Number((raw as any).sort_order)
            : index,
        is_primary: raw && typeof raw === 'object' ? Boolean((raw as any).is_primary ?? index === 0) : index === 0,
      });
    });
  }

  const fallback = typeof fallbackUrl === 'string' ? fallbackUrl.trim() : String(fallbackUrl ?? '').trim();
  if (fallback && !seen.has(fallback)) {
    images.unshift({ url: fallback, sort_order: 0, is_primary: images.length === 0 });
  }

  return images.map((image, index) => ({
    ...image,
    sort_order: index,
    is_primary: index === 0,
  }));
}

export function productImageUrls(product: Product | null | undefined): string[] {
  const urls = normalizeProductImages(product?.images, product?.image_url).map((image) => image.url);
  return urls.length > 0 ? urls : [];
}

function normalizeProduct(raw: any): Product {
  const images = normalizeProductImages(raw?.images, raw?.image_url);
  const imageUrl = images[0]?.url ?? raw?.image_url ?? '';

  return {
    id: raw?.id != null ? String(raw.id) : '',
    sku: raw?.sku ?? undefined,
    name: raw?.name ?? '',
    description: raw?.description ?? '',
    category: raw?.category ?? 'de-sezon',
    price: typeof raw?.price === 'number' ? raw.price : Number(raw?.price ?? 0),
    measure_unit: normalizeProductMeasureUnit(raw?.measure_unit),
    promotion_label: normalizeProductPromotionLabel(raw?.promotion_label),
    image_url: imageUrl,
    images,
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

export function productPriority(product: Product): number {
  const promo = normalizeProductPromotionLabel(product?.promotion_label);
  if (promo === 'NOU_PROMOTIE') return 0;
  if (promo === 'PROMOTIE') return 1;
  if (promo === 'NOU') return 2;
  return 3;
}

export function sortProductPriority(a: Product, b: Product): number {
  const rank = productPriority(a) - productPriority(b);
  if (rank !== 0) return rank;

  const aTime = Date.parse(a.updated_at ?? a.created_at ?? '') || 0;
  const bTime = Date.parse(b.updated_at ?? b.created_at ?? '') || 0;
  return bTime - aTime;
}

export function hasProductPromotion(product: Product | null | undefined): boolean {
  return isPromotedProduct(product?.promotion_label);
}

// Skip refetching on every page mount: data younger than this is served from
// the store (the API layer also caches publicly for 60s via s-maxage).
const STALE_AFTER_MS = 60 * 1000;
let lastLoad: { key: string; at: number } | null = null;

export const productsStore = {
  subscribe: store.subscribe,

  invalidate() {
    lastLoad = null;
  },

  async loadAll(category?: string | null, options: { force?: boolean } = {}) {
    const key = category ?? '';
    if (!options.force && lastLoad?.key === key && Date.now() - lastLoad.at < STALE_AFTER_MS) {
      return get(store).items;
    }

    store.update((state) => ({ ...state, loading: true, error: null }));
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (category) params.set('category', category);
      const data = await apiFetch<any>(`/api/products?${params.toString()}`, {
        fallbackError: 'Nu am putut încărca produsele.',
      });

      const normalized = (Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [])
        .map(normalizeProduct)
        .sort(sortProductPriority);
      store.set({ items: normalized, loading: false, error: null });
      lastLoad = { key, at: Date.now() };
      return normalized;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Eroare necunoscută.';
      store.set({ items: [], loading: false, error: msg });
      lastLoad = null;
      return [];
    }
  },

  async getById(id: string) {
    const data = await apiFetch<any>(`/api/products/${id}`, {
      fallbackError: 'Nu am putut încărca produsul.',
    });
    const raw = data && typeof data === 'object' && 'item' in data ? data.item : data;
    return normalizeProduct(raw) as Product;
  },
};

export async function getAllProducts(category?: string | null) {
  return productsStore.loadAll(category);
}
