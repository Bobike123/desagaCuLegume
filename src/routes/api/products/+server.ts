import { json } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabase';
import {
  ensureCategory,
  fetchCategoryMap,
  findCategoryBySlug,
  formatProductRow,
  uniqueProductSlug
} from '$lib/server/catalog';

function cleanString(value: unknown) {
  return String(value ?? '').trim();
}

function cleanNumber(value: unknown, fallback = 0) {
  const n = Number(value ?? fallback);
  return Number.isFinite(n) ? n : fallback;
}

function cleanStatus(value: unknown) {
  const status = cleanString(value || 'ACTIVE').toUpperCase();
  return ['ACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED', 'DRAFT'].includes(status)
    ? status
    : 'ACTIVE';
}

export async function GET({ locals, url }) {
  try {
    const admin = createAdminClient();
    const categorySlug = url.searchParams.get('category');

    let query = admin
      .from('products')
      .select('product_id, category_id, sku, slug, name, description, price, currency_code, image_url, stock_quantity, status, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (!locals.isAdmin) {
      query = query.in('status', ['ACTIVE', 'OUT_OF_STOCK']);
    }

    if (categorySlug) {
      const category = await findCategoryBySlug(categorySlug);
      if (!category) return json({ items: [] }, { status: 200 });
      query = query.eq('category_id', category.category_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    const categoryMap = await fetchCategoryMap((data ?? []).map((row) => row.category_id));
    const items = (data ?? []).map((row) =>
      formatProductRow(row, categoryMap.get(Number(row.category_id))?.slug)
    );

    return json({ items }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load products';
    return json({ error: message }, { status: 400 });
  }
}

export async function POST({ locals, request }) {
  if (!locals.isAdmin || !locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));

    const name = cleanString(body.name);
    if (!name) return json({ error: 'Numele produsului este obligatoriu.' }, { status: 400 });

    const category = await ensureCategory(cleanString(body.category || 'de-sezon'));
    const slug = body.slug ? cleanString(body.slug) : await uniqueProductSlug(name);
    const sku = cleanString(body.sku) || `PROD-${Date.now()}`;

    const payload = {
      category_id: category.category_id,
      sku,
      slug,
      name,
      description: cleanString(body.description) || null,
      price: cleanNumber(body.price),
      currency_code: cleanString(body.currency_code) || 'RON',
      stock_quantity: Math.max(0, cleanNumber(body.stock_quantity)),
      status: cleanStatus(body.status),
      image_url: cleanString(body.image_url) || null,
      created_by_admin_id: locals.user.id,
      updated_by_admin_id: locals.user.id,
    };

    const { data, error } = await createAdminClient()
      .from('products')
      .insert(payload)
      .select('product_id, category_id, sku, slug, name, description, price, currency_code, image_url, stock_quantity, status, created_at, updated_at')
      .single();

    if (error) throw error;

    return json({ item: formatProductRow(data, category.slug) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create product';
    return json({ error: message }, { status: 400 });
  }
}
