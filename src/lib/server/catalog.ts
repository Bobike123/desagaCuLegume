import { createAdminClient } from '$lib/server/supabase';

export type CategoryRow = {
  category_id: number;
  name: string;
  slug: string;
  description?: string | null;
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
  image_url: string | null;
  stock_quantity: number | string | null;
  status: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export function slugify(value: string) {
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

function categoryNameFromSlug(slug: string) {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export async function ensureCategory(value: string): Promise<CategoryRow> {
  const admin = createAdminClient();
  const slug = slugify(value || 'de-sezon');

  const existing = await admin
    .from('product_categories')
    .select('category_id, name, slug, description')
    .eq('slug', slug)
    .maybeSingle();

  if (existing.error) throw existing.error;
  if (existing.data) return existing.data as CategoryRow;

  const created = await admin
    .from('product_categories')
    .insert({
      slug,
      name: categoryNameFromSlug(slug),
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

export async function findCategoryBySlug(slugValue: string) {
  const admin = createAdminClient();
  const slug = slugify(slugValue);

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

export function formatProductRow(row: ProductRow, categorySlug = 'de-sezon') {
  const stockQuantity = Number(row.stock_quantity ?? 0);
  const status = String(row.status ?? 'DRAFT');

  return {
    id: String(row.product_id),
    product_id: row.product_id,
    category_id: row.category_id,
    sku: row.sku,
    slug: row.slug,
    name: row.name,
    description: row.description ?? '',
    category: categorySlug || 'de-sezon',
    price: Number(row.price ?? 0),
    currency_code: row.currency_code ?? 'RON',
    image_url: row.image_url ?? '',
    stock_quantity: stockQuantity,
    status,
    in_stock: status === 'ACTIVE' && stockQuantity > 0,
    created_at: row.created_at ?? null,
    updated_at: row.updated_at ?? null,
  };
}
