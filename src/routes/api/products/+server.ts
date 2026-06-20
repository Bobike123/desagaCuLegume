import { json } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabase';
import { getPagination, getPaginationMeta, noStoreHeaders, publicCacheHeaders } from '$lib/server/pagination';
import {
  ensureCategory,
  fetchCategoryMap,
  findCategoryBySlug,
  formatProductRow,
  isAllowedProductCategory,
  normalizeProductCategorySlug,
  PRODUCT_STATUSES,
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

export async function GET({ locals, url, setHeaders }) {
  try {
    const admin = createAdminClient();
    const requestedCategorySlug = cleanString(url.searchParams.get('category')).slice(0, 80);
    const categorySlug = requestedCategorySlug ? normalizeProductCategorySlug(requestedCategorySlug) : null;
    const pagination = getPagination(url, { defaultLimit: 50, maxLimit: 100 });

    if (requestedCategorySlug && !categorySlug) {
      if (locals.isAdmin) setHeaders(noStoreHeaders);
      else setHeaders(publicCacheHeaders());
      return json({ items: [], page: getPaginationMeta(pagination, 0) }, { status: 200 });
    }

    let query = admin
      .from('products')
      .select('product_id, category_id, sku, slug, name, description, price, currency_code, image_url, stock_quantity, status, created_at, updated_at', {
        count: 'exact',
      })
      .is('deleted_at', null);

    if (!locals.isAdmin) {
      query = query.in('status', ['ACTIVE', 'OUT_OF_STOCK']);
    }

    if (categorySlug) {
      const category = await findCategoryBySlug(categorySlug);
      if (!category) {
        if (locals.isAdmin) setHeaders(noStoreHeaders);
        else setHeaders(publicCacheHeaders());
        return json({ items: [], page: getPaginationMeta(pagination, 0) }, { status: 200 });
      }
      query = query.eq('category_id', category.category_id);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(pagination.offset, pagination.to);
    if (error) throw error;

    const categoryMap = await fetchCategoryMap((data ?? []).map((row) => row.category_id));
    const items = (data ?? [])
      .map((row) => formatProductRow(row, categoryMap.get(Number(row.category_id))?.slug))
      .filter((item) => isAllowedProductCategory(item.category));

    if (locals.isAdmin) setHeaders(noStoreHeaders);
    else setHeaders(publicCacheHeaders());

    return json({ items, page: getPaginationMeta(pagination, count ?? 0) }, { status: 200 });
  } catch (error) {
    console.error('Products load failed', error);
    return json({ error: 'Nu am putut încărca produsele.' }, { status: 400 });
  }
}

export async function POST({ locals, request }) {
  if (!locals.isAdmin || !locals.user) {
    return json({ error: 'Acces neautorizat.' }, { status: 401 });
  }

  try {
    const body = await readJsonBody(request, { maxBytes: LIMITS.smallJson });

    const name = stringField(body, 'name', { required: true, max: 160, fieldLabel: 'Numele produsului' });
    if (!name) return json({ error: 'Numele produsului este obligatoriu.' }, { status: 400 });

    const requestedCategory = stringField(body, 'category', { max: 80, defaultValue: 'de-sezon', fieldLabel: 'Categoria' });
    const categorySlug = normalizeProductCategorySlug(requestedCategory);

    if (!categorySlug) {
      return json({ error: 'Categoria trebuie să fie De sezon sau La borcan.' }, { status: 400 });
    }

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

    console.error('Product create failed', error);
    return json({ error: 'Nu am putut crea produsul.' }, { status: 400 });
  }
}
