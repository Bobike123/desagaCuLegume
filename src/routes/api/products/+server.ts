import { json } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabase';
import {
  ensureCategory,
  fetchCategoryMap,
  findCategoryBySlug,
  formatProductRow,
  uniqueProductSlug,
} from '$lib/server/catalog';
import {
  cleanString,
  enumField,
  LIMITS,
  nullableStringField,
  numberField,
  readJsonBody,
  safeUrl,
  stringField,
  validationErrorResponse,
} from '$lib/server/validation';

const PRODUCT_STATUSES = ['ACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED', 'DRAFT'] as const;

export async function GET({ locals, url }) {
  try {
    const admin = createAdminClient();
    const categorySlug = cleanString(url.searchParams.get('category')).slice(0, 80);

    if (categorySlug === 'horeca') {
      return json({ items: [] }, { status: 200 });
    }

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
    const items = (data ?? [])
      .map((row) => formatProductRow(row, categoryMap.get(Number(row.category_id))?.slug))
      .filter((item) => locals.isAdmin || item.category !== 'horeca');

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
    const body = await readJsonBody(request, { maxBytes: LIMITS.smallJson });

    const name = stringField(body, 'name', { required: true, max: 160, fieldLabel: 'Numele produsului' });
    if (!name) return json({ error: 'Numele produsului este obligatoriu.' }, { status: 400 });

    const requestedCategory = stringField(body, 'category', { max: 80, defaultValue: 'de-sezon', fieldLabel: 'Categoria' });
    const categorySlug = requestedCategory === 'horeca' ? 'de-sezon' : requestedCategory;
    const category = await ensureCategory(categorySlug);
    const slug = body.slug ? stringField(body, 'slug', { max: 120, fieldLabel: 'Slug' }) : await uniqueProductSlug(name);
    const sku = stringField(body, 'sku', { max: 80, fieldLabel: 'SKU' }) || `PROD-${Date.now()}`;

    const payload = {
      category_id: category.category_id,
      sku,
      slug,
      name,
      description: nullableStringField(body, 'description', { max: LIMITS.longText, fieldLabel: 'Descrierea' }),
      price: numberField(body, 'price', { defaultValue: 0, min: 0, max: 100_000, fieldLabel: 'Prețul' }),
      currency_code: stringField(body, 'currency_code', {
        defaultValue: 'RON',
        max: 3,
        pattern: /^[A-Z]{3}$/i,
        fieldLabel: 'Moneda',
      }).toUpperCase(),
      stock_quantity: numberField(body, 'stock_quantity', {
        defaultValue: 0,
        integer: true,
        min: 0,
        max: 100_000,
        fieldLabel: 'Stocul',
      }),
      status: enumField(body, 'status', PRODUCT_STATUSES, 'ACTIVE'),
      image_url: safeUrl(body.image_url),
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
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    const message = error instanceof Error ? error.message : 'Failed to create product';
    return json({ error: message }, { status: 400 });
  }
}
