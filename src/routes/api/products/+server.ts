import { json } from '@sveltejs/kit';
import { logRouteError } from '$lib/server/log';
import { createAdminClient } from '$lib/server/supabase';
import { getPagination, getPaginationMeta, noStoreHeaders, publicCacheHeaders } from '$lib/server/pagination';
import {
  ALLOWED_CATEGORIES_MESSAGE,
  DEFAULT_CATEGORY_SLUG,
  ensureCategory,
  fetchAllowedCategoryIds,
  fetchCategoryMap,
  fetchProductImageMap,
  findCategoryBySlug,
  formatProductRow,
  isAllowedProductCategory,
  normalizeProductCategorySlug,
  normalizeProductImageUrls,
  PRODUCT_MEASURE_UNITS,
  PRODUCT_PROMOTION_LABELS,
  PRODUCT_STATUSES,
  replaceProductImages,
  uniqueProductSlug,
} from '$lib/server/catalog';
import { setProductStock } from '$lib/server/product-stock';
import {
  arrayField,
  cleanString,
  enumField,
  LIMITS,
  nullableStringField,
  numberField,
  readJsonBody,
  requireNumericId,
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
      .select('product_id, category_id, sku, slug, name, description, price, currency_code, measure_unit, promotion_label, image_url, stock_quantity, status, created_at, updated_at', {
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
    } else {
      // Constrain to allowed categories in SQL so count/range stay truthful
      // and NULL-category rows cannot leak into the listing.
      const allowedCategoryIds = await fetchAllowedCategoryIds();
      if (allowedCategoryIds.length === 0) {
        if (locals.isAdmin) setHeaders(noStoreHeaders);
        else setHeaders(publicCacheHeaders());
        return json({ items: [], page: getPaginationMeta(pagination, 0) }, { status: 200 });
      }
      query = query.in('category_id', allowedCategoryIds);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(pagination.offset, pagination.to);
    if (error) throw error;

    const categoryMap = await fetchCategoryMap((data ?? []).map((row) => row.category_id));
    const imageMap = await fetchProductImageMap((data ?? []).map((row) => row.product_id));
    const items = (data ?? []).map((row) =>
      formatProductRow(
        row,
        categoryMap.get(Number(row.category_id))?.slug,
        imageMap.get(String(row.product_id))
      )
    );

    if (locals.isAdmin) setHeaders(noStoreHeaders);
    else setHeaders(publicCacheHeaders());

    return json({ items, page: getPaginationMeta(pagination, count ?? 0) }, { status: 200 });
  } catch (error) {
    const requestId = logRouteError('Products load failed', error);
    return json({ error: 'Nu am putut încărca produsele.', requestId }, { status: 400 });
  }
}

export async function POST({ locals, request }) {
  if (!locals.isAdmin || !locals.user) {
    return json({ error: 'Acces neautorizat.' }, { status: 401 });
  }

  try {
    const body = await readJsonBody(request, { maxBytes: LIMITS.largeJson });

    const name = stringField(body, 'name', { required: true, max: 160, fieldLabel: 'Numele produsului' });
    if (!name) return json({ error: 'Numele produsului este obligatoriu.' }, { status: 400 });

    const requestedCategory = stringField(body, 'category', { max: 80, defaultValue: DEFAULT_CATEGORY_SLUG, fieldLabel: 'Categoria' });
    const categorySlug = normalizeProductCategorySlug(requestedCategory);

    if (!categorySlug) {
      return json({ error: ALLOWED_CATEGORIES_MESSAGE }, { status: 400 });
    }

    const category = await ensureCategory(categorySlug);
    const slug = body.slug ? stringField(body, 'slug', { max: 120, fieldLabel: 'Slug' }) : await uniqueProductSlug(name);
    const sku = stringField(body, 'sku', { max: 80, fieldLabel: 'SKU' }) || `PROD-${Date.now()}`;
    const imageUrls = normalizeProductImageUrls(body.images, body.image_url);

    const payload = {
      category_id: category.category_id,
      sku,
      slug,
      name,
      description: nullableStringField(body, 'description', { max: LIMITS.longText, fieldLabel: 'Descrierea' }),
      price: numberField(body, 'price', { defaultValue: 0, min: 0, max: 100_000, fieldLabel: 'Prețul' }),
      measure_unit: enumField(body, 'measure_unit', PRODUCT_MEASURE_UNITS, 'PER_KG'),
      promotion_label: enumField(body, 'promotion_label', PRODUCT_PROMOTION_LABELS, 'NONE'),
      currency_code: stringField(body, 'currency_code', {
        defaultValue: 'RON',
        max: 3,
        pattern: /^[A-Z]{3}$/i,
        fieldLabel: 'Moneda',
      }).toUpperCase(),
      // Stock is set through the inventory ledger below, never directly.
      stock_quantity: 0,
      status: enumField(body, 'status', PRODUCT_STATUSES, 'ACTIVE'),
      image_url: imageUrls[0] ?? null,
      created_by_admin_id: locals.user.id,
      updated_by_admin_id: locals.user.id,
    };

    const initialStock = numberField(body, 'stock_quantity', {
      defaultValue: 0,
      integer: true,
      min: 0,
      max: 100_000,
      fieldLabel: 'Stocul',
    });

    const { data, error } = await createAdminClient()
      .from('products')
      .insert(payload)
      .select('product_id, category_id, sku, slug, name, description, price, currency_code, measure_unit, promotion_label, image_url, stock_quantity, status, created_at, updated_at')
      .single();

    if (error) throw error;

    if (initialStock > 0) {
      data.stock_quantity = await setProductStock(data.product_id, initialStock, locals.user.id, 'Stoc inițial');
    }

    await replaceProductImages(data.product_id, imageUrls);

    return json({ item: formatProductRow(data, category.slug, imageUrls.map((url, index) => ({ image_url: url, sort_order: index, is_primary: index === 0 }))) }, { status: 201 });
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    const requestId = logRouteError('Product create failed', error);
    return json({ error: 'Nu am putut crea produsul.', requestId }, { status: 400 });
  }
}

export async function PATCH({ locals, request }) {
  if (!locals.isAdmin || !locals.user) {
    return json({ error: 'Acces neautorizat.' }, { status: 401 });
  }

  try {
    const body = await readJsonBody(request, { maxBytes: LIMITS.smallJson });
    const ids = [...new Set(arrayField(body, 'ids', 100).map((id) => requireNumericId(id, 'ID produs')))];

    if (ids.length === 0) {
      return json({ error: 'Selectează cel puțin un produs.' }, { status: 400 });
    }

    const status = enumField(body, 'status', PRODUCT_STATUSES, 'ACTIVE');
    const payload: Record<string, unknown> = {
      status,
      updated_by_admin_id: locals.user.id,
    };

    if (body.promotion_label != null) {
      payload.promotion_label = enumField(body, 'promotion_label', PRODUCT_PROMOTION_LABELS, 'NONE');
    }

    const { data, error } = await createAdminClient()
      .from('products')
      .update(payload)
      .in('product_id', ids)
      .is('deleted_at', null)
      .select('product_id, category_id, sku, slug, name, description, price, currency_code, measure_unit, promotion_label, image_url, stock_quantity, status, created_at, updated_at');

    if (error) throw error;

    const categoryMap = await fetchCategoryMap((data ?? []).map((row) => row.category_id));
    const imageMap = await fetchProductImageMap((data ?? []).map((row) => row.product_id));
    const items = (data ?? [])
      .map((row) =>
        formatProductRow(
          row,
          categoryMap.get(Number(row.category_id))?.slug,
          imageMap.get(String(row.product_id))
        )
      )
      .filter((item) => isAllowedProductCategory(item.category));

    return json({ items, count: items.length, status }, { status: 200 });
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    const requestId = logRouteError('Products bulk status update failed', error);
    return json({ error: 'Nu am putut actualiza produsele selectate.', requestId }, { status: 400 });
  }
}
