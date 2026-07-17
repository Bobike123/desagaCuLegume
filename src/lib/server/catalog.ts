import { createAdminClient } from '$lib/server/supabase';
import { RequestValidationError, safeUrl } from '$lib/server/validation';
import {
  PRODUCT_CATEGORIES as CATEGORY_METADATA,
  PRODUCT_CATEGORY_SLUGS,
  DEFAULT_CATEGORY_SLUG,
  categoryMeta,
  type ProductCategorySlug,
} from '$lib/categories';

// Re-exported so existing server-side imports keep working unchanged.
export { PRODUCT_CATEGORY_SLUGS, DEFAULT_CATEGORY_SLUG, type ProductCategorySlug };

// Human-readable message listing the allowed categories, reused across the
// create/update/ensure paths.
export const ALLOWED_CATEGORIES_MESSAGE = `Categoria trebuie să fie ${CATEGORY_METADATA.map((c) => c.name).join(', ')}.`;

export const PRODUCT_STATUSES = ['ACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED', 'DRAFT'] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const PRODUCT_MEASURE_UNITS = ['PER_KG', 'PER_BUC'] as const;
export type ProductMeasureUnit = (typeof PRODUCT_MEASURE_UNITS)[number];

export const PRODUCT_PROMOTION_LABELS = ['NONE', 'NOU', 'PROMOTIE', 'NOU_PROMOTIE'] as const;
export type ProductPromotionLabel = (typeof PRODUCT_PROMOTION_LABELS)[number];

export const PRODUCT_CATEGORIES = CATEGORY_METADATA.map(({ slug, name }) => ({ slug, name }));

const PRODUCT_CATEGORY_SLUG_SET = new Set<string>(PRODUCT_CATEGORY_SLUGS);
const MAX_PRODUCT_IMAGES = 12;

export type CategoryRow = {
  category_id: number;
  name: string;
  slug: string;
  description?: string | null;
};

export type ProductImageRow = {
  product_image_id?: number | string;
  product_id?: number | string;
  image_url: string | null;
  url?: string | null;
  alt_text?: string | null;
  sort_order?: number | string | null;
  is_primary?: boolean | null;
};

export type ProductImage = {
  id?: string;
  url: string;
  alt_text?: string;
  sort_order: number;
  is_primary: boolean;
};

export type ProductRow = {
  product_id: number | string;
  category_id: number | null;
  sku: string;
  slug: string;
  name: string;
  description: string | null;
  price: number | string;
  currency_code?: string | null;
  measure_unit?: string | null;
  promotion_label?: string | null;
  image_url: string | null;
  stock_quantity: number | string | null;
  status: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ă/g, 'a')
    .replace(/â/g, 'a')
    .replace(/î/g, 'i')
    .replace(/ș|ş/g, 's')
    .replace(/ț|ţ/g, 't')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';
}

export function normalizeProductCategorySlug(value: string | null | undefined): ProductCategorySlug | null {
  const slug = slugify(value || DEFAULT_CATEGORY_SLUG);
  return PRODUCT_CATEGORY_SLUG_SET.has(slug) ? (slug as ProductCategorySlug) : null;
}

export function isAllowedProductCategory(value: string | null | undefined) {
  return normalizeProductCategorySlug(value) !== null;
}

export function normalizeProductMeasureUnit(value: string | null | undefined): ProductMeasureUnit {
  const normalized = String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');

  if (normalized === 'PER_BUC' || normalized === 'BUC' || normalized === 'BUCATA' || normalized === 'PE_BUCATA') {
    return 'PER_BUC';
  }

  return 'PER_KG';
}

export function normalizeProductPromotionLabel(value: string | null | undefined): ProductPromotionLabel {
  const normalized = String(value ?? '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_');

  if (normalized === 'NOU') return 'NOU';
  if (normalized === 'PROMOTIE' || normalized === 'PROMO' || normalized === 'REDUCERE') return 'PROMOTIE';
  if (
    normalized === 'BOTH' ||
    normalized === 'AMBELE' ||
    normalized === 'NOU_PROMOTIE' ||
    normalized === 'NOU_SI_PROMOTIE' ||
    normalized === 'NOU_PROMO'
  ) {
    return 'NOU_PROMOTIE';
  }

  return 'NONE';
}

export function normalizeProductImageRows(rows: ProductImageRow[] | null | undefined, fallbackUrl?: string | null): ProductImage[] {
  const seen = new Set<string>();
  const images: ProductImage[] = [];

  for (const row of rows ?? []) {
    const url = String(row?.image_url ?? row?.url ?? '').trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    images.push({
      id: row?.product_image_id != null ? String(row.product_image_id) : undefined,
      url,
      alt_text: String(row?.alt_text ?? '').trim() || undefined,
      sort_order: Number.isFinite(Number(row?.sort_order)) ? Number(row?.sort_order) : images.length,
      is_primary: Boolean(row?.is_primary),
    });
  }

  const fallback = String(fallbackUrl ?? '').trim();
  if (fallback && !seen.has(fallback)) {
    images.unshift({ url: fallback, sort_order: 0, is_primary: images.length === 0 });
  }

  return images
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)
    .map((image, index) => ({ ...image, sort_order: index, is_primary: index === 0 }));
}

export function normalizeProductImageUrls(rawImages: unknown, fallbackImageUrl?: unknown): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();

  function add(raw: unknown) {
    const value = safeUrl(raw);
    if (!value || seen.has(value)) return;
    seen.add(value);
    urls.push(value);
  }

  if (Array.isArray(rawImages)) {
    if (rawImages.length > MAX_PRODUCT_IMAGES) {
      throw new RequestValidationError(`Poți adăuga maximum ${MAX_PRODUCT_IMAGES} imagini la un produs.`);
    }

    for (const raw of rawImages) {
      if (typeof raw === 'string') add(raw);
      else if (raw && typeof raw === 'object') add((raw as Record<string, unknown>).url ?? (raw as Record<string, unknown>).image_url);
      else if (raw != null) throw new RequestValidationError('Lista de imagini conține valori invalide.');
    }
  }

  if (urls.length === 0 && fallbackImageUrl != null) add(fallbackImageUrl);

  return urls;
}

export async function ensureCategory(value: string): Promise<CategoryRow> {
  const admin = createAdminClient();
  const slug = normalizeProductCategorySlug(value);

  if (!slug) {
    throw new Error(ALLOWED_CATEGORIES_MESSAGE);
  }

  const existing = await admin
    .from('product_categories')
    .select('category_id, name, slug, description')
    .eq('slug', slug)
    .maybeSingle();

  if (existing.error) throw existing.error;
  if (existing.data) return existing.data as CategoryRow;

  const meta = categoryMeta(slug);
  const created = await admin
    .from('product_categories')
    .insert({
      slug,
      name: meta.name,
      description: meta.description,
    })
    .select('category_id, name, slug, description')
    .single();

  if (created.error) throw created.error;
  return created.data as CategoryRow;
}

export async function fetchCategoryMap(ids: Array<number | string | null | undefined>) {
  const admin = createAdminClient();
  const cleanIds = [...new Set(ids.map((id) => Number(id)).filter(Number.isFinite))];

  const map = new Map<number, CategoryRow>();
  if (cleanIds.length === 0) return map;

  const { data, error } = await admin
    .from('product_categories')
    .select('category_id, name, slug, description')
    .in('category_id', cleanIds);

  if (error) throw error;

  for (const row of data ?? []) {
    map.set(Number(row.category_id), row as CategoryRow);
  }

  return map;
}

export async function fetchProductImageMap(ids: Array<number | string | null | undefined>) {
  const admin = createAdminClient();
  const cleanIds = [...new Set(ids.map((id) => Number(id)).filter(Number.isFinite))];
  const rowsByProduct = new Map<string, ProductImageRow[]>();
  const map = new Map<string, ProductImage[]>();

  if (cleanIds.length === 0) return map;

  const { data, error } = await admin
    .from('product_images')
    .select('product_image_id, product_id, image_url, alt_text, sort_order, is_primary')
    .in('product_id', cleanIds)
    .order('product_id', { ascending: true })
    .order('sort_order', { ascending: true });

  if (error) throw error;

  for (const row of data ?? []) {
    const typedRow = row as ProductImageRow;
    const key = String(typedRow.product_id);
    const list = rowsByProduct.get(key) ?? [];
    list.push(typedRow);
    rowsByProduct.set(key, list);
  }

  for (const [key, rows] of rowsByProduct.entries()) {
    map.set(key, normalizeProductImageRows(rows));
  }

  return map;
}

export async function replaceProductImages(productId: number | string, imageUrls: string[]) {
  const admin = createAdminClient();
  const id = Number(productId);
  if (!Number.isFinite(id)) throw new RequestValidationError('ID produs invalid.');

  const { error: deleteError } = await admin.from('product_images').delete().eq('product_id', id);
  if (deleteError) throw deleteError;

  if (imageUrls.length === 0) return;

  const rows = imageUrls.slice(0, MAX_PRODUCT_IMAGES).map((url, index) => ({
    product_id: id,
    image_url: url,
    sort_order: index,
    is_primary: index === 0,
  }));

  const { error } = await admin.from('product_images').insert(rows);
  if (error) throw error;
}

// Category ids for the allowed slugs, used to constrain product queries in
// SQL. Filtering after .range() skews counts/page sizes and lets NULL-category
// rows (defaulted to 'legume' at render time) leak into listings.
export async function fetchAllowedCategoryIds() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('product_categories')
    .select('category_id')
    .in('slug', PRODUCT_CATEGORY_SLUGS);

  if (error) throw error;
  return (data ?? []).map((row) => Number(row.category_id)).filter(Number.isFinite);
}

export async function findCategoryBySlug(slugValue: string) {
  const admin = createAdminClient();
  const slug = normalizeProductCategorySlug(slugValue);

  if (!slug) return null;

  const { data, error } = await admin
    .from('product_categories')
    .select('category_id, name, slug, description')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  return data as CategoryRow | null;
}

export async function uniqueProductSlug(value: string, exceptProductId?: string | number) {
  const admin = createAdminClient();
  const base = slugify(value || 'produs');
  let candidate = base;
  let suffix = 2;

  while (true) {
    let query = admin
      .from('products')
      .select('product_id')
      .eq('slug', candidate)
      .maybeSingle();

    const { data, error } = await query;
    if (error) throw error;

    if (!data || String(data.product_id) === String(exceptProductId ?? '')) {
      return candidate;
    }

    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

export function formatProductRow(row: ProductRow, categorySlug: string = DEFAULT_CATEGORY_SLUG, productImages?: ProductImageRow[] | ProductImage[]) {
  const stockQuantity = Number(row.stock_quantity ?? 0);
  const status = String(row.status ?? 'DRAFT');
  const images = normalizeProductImageRows(productImages as ProductImageRow[] | undefined, row.image_url);
  const imageUrl = images[0]?.url ?? row.image_url ?? '';

  return {
    id: String(row.product_id),
    product_id: row.product_id,
    category_id: row.category_id,
    sku: row.sku,
    slug: row.slug,
    name: row.name,
    description: row.description ?? '',
    category: categorySlug || DEFAULT_CATEGORY_SLUG,
    price: Number(row.price ?? 0),
    currency_code: row.currency_code ?? 'RON',
    measure_unit: normalizeProductMeasureUnit(row.measure_unit),
    promotion_label: normalizeProductPromotionLabel(row.promotion_label),
    image_url: imageUrl,
    images,
    stock_quantity: stockQuantity,
    status,
    in_stock: status === 'ACTIVE' && stockQuantity > 0,
    created_at: row.created_at ?? null,
    updated_at: row.updated_at ?? null,
  };
}
