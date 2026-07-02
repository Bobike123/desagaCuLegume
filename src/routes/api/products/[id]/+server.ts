import { json } from '@sveltejs/kit';
import { logRouteError } from '$lib/server/log';
import { createAdminClient } from '$lib/server/supabase';
import {
  ensureCategory,
  fetchCategoryMap,
  fetchProductImageMap,
  formatProductRow,
  isAllowedProductCategory,
  normalizeProductCategorySlug,
  normalizeProductImageUrls,
  PRODUCT_MEASURE_UNITS,
  PRODUCT_PROMOTION_LABELS,
  PRODUCT_STATUSES,
  replaceProductImages,
} from '$lib/server/catalog';
import { setProductStock } from '$lib/server/product-stock';
import {
  booleanField,
  enumField,
  LIMITS,
  nullableStringField,
  numberField,
  optionalEnumField,
  readJsonBody,
  requireNumericId,
  stringField,
  validationErrorResponse,
} from '$lib/server/validation';

async function getProductById(id: string, includeHidden = false) {
  const productId = requireNumericId(id, 'ID produs');
  const admin = createAdminClient();
  let query = admin
    .from('products')
    .select('product_id, sku, slug, name, description, price, currency_code, measure_unit, promotion_label, image_url, stock_quantity, status, created_at, updated_at, category_id')
    .eq('product_id', productId)
    .is('deleted_at', null);

  if (!includeHidden) {
    query = query.in('status', ['ACTIVE', 'OUT_OF_STOCK']);
  }

  const { data, error } = await query.maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const categoryMap = await fetchCategoryMap([data.category_id]);
  const imageMap = await fetchProductImageMap([data.product_id]);
  const item = formatProductRow(data, categoryMap.get(Number(data.category_id))?.slug, imageMap.get(String(data.product_id)));
  return isAllowedProductCategory(item.category) ? item : null;
}

export async function GET({ params, locals }) {
  try {
    const item = await getProductById(params.id, locals.isAdmin);
    if (!item) return json({ error: 'Produsul nu a fost găsit.' }, { status: 404 });
    return json({ item }, { status: 200 });
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    const requestId = logRouteError('Product load failed', error);
    return json({ error: 'Nu am putut încărca produsul.', requestId }, { status: 400 });
  }
}

export async function PUT({ locals, params, request }) {
  if (!locals.isAdmin || !locals.user) {
    return json({ error: 'Acces neautorizat.' }, { status: 401 });
  }

  try {
    const productId = requireNumericId(params.id, 'ID produs');
    const body = await readJsonBody(request, { maxBytes: LIMITS.largeJson });
    const admin = createAdminClient();
    const categorySlug = normalizeProductCategorySlug(
      stringField(body, 'category', { defaultValue: 'de-sezon', max: 80, fieldLabel: 'Categoria' })
    );

    if (!categorySlug) {
      return json({ error: 'Categoria trebuie să fie De sezon sau La borcan.' }, { status: 400 });
    }

    const category = await ensureCategory(categorySlug);
    const imageUrls = normalizeProductImageUrls(body.images, body.image_url);
    const payload: Record<string, unknown> = {
      category_id: category.category_id,
      name: stringField(body, 'name', { required: true, max: 160, fieldLabel: 'Numele produsului' }),
      description: nullableStringField(body, 'description', { max: LIMITS.longText, fieldLabel: 'Descrierea' }),
      price: numberField(body, 'price', { required: true, min: 0, max: 100_000, fieldLabel: 'Prețul' }),
      measure_unit: enumField(body, 'measure_unit', PRODUCT_MEASURE_UNITS, 'PER_KG'),
      promotion_label: enumField(body, 'promotion_label', PRODUCT_PROMOTION_LABELS, 'NONE'),
      image_url: imageUrls[0] ?? null,
      status: enumField(body, 'status', PRODUCT_STATUSES, 'ACTIVE'),
      updated_by_admin_id: locals.user.id,
    };

    const nextStock = numberField(body, 'stock_quantity', {
      required: true,
      integer: true,
      min: 0,
      max: 100_000,
      fieldLabel: 'Stocul',
    });

    if (body.sku) payload.sku = stringField(body, 'sku', { max: 80, fieldLabel: 'SKU' });
    if (body.slug) payload.slug = stringField(body, 'slug', { max: 120, fieldLabel: 'Slug' });

    const { error } = await admin.from('products').update(payload).eq('product_id', productId);
    if (error) throw error;

    await setProductStock(productId, nextStock, locals.user.id);

    await replaceProductImages(productId, imageUrls);

    const item = await getProductById(productId, locals.isAdmin);
    return json({ item }, { status: 200 });
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;
    if ((error as { code?: string })?.code === 'P0002') {
      return json({ error: 'Produsul nu a fost găsit.' }, { status: 404 });
    }

    const requestId = logRouteError('Product update failed', error);
    return json({ error: 'Nu am putut actualiza produsul.', requestId }, { status: 400 });
  }
}

export async function PATCH({ locals, params, request }) {
  if (!locals.isAdmin || !locals.user) {
    return json({ error: 'Acces neautorizat.' }, { status: 401 });
  }

  try {
    const productId = requireNumericId(params.id, 'ID produs');
    const body = await readJsonBody(request, { maxBytes: LIMITS.smallJson });
    const admin = createAdminClient();
    const payload: Record<string, unknown> = {
      updated_by_admin_id: locals.user.id,
    };

    const nextStatus = optionalEnumField(body, 'status', PRODUCT_STATUSES);
    if (nextStatus) payload.status = nextStatus;

    let nextStock: number | null = null;
    if (body.stock_quantity != null) {
      nextStock = numberField(body, 'stock_quantity', {
        integer: true,
        min: 0,
        max: 100_000,
        fieldLabel: 'Stocul',
      });
    }
    if (body.price != null) {
      payload.price = numberField(body, 'price', { min: 0, max: 100_000, fieldLabel: 'Prețul' });
    }

    const nextMeasureUnit = optionalEnumField(body, 'measure_unit', PRODUCT_MEASURE_UNITS);
    if (nextMeasureUnit) payload.measure_unit = nextMeasureUnit;

    const nextPromotionLabel = optionalEnumField(body, 'promotion_label', PRODUCT_PROMOTION_LABELS);
    if (nextPromotionLabel) payload.promotion_label = nextPromotionLabel;

    if (body.in_stock != null && body.status == null && body.stock_quantity == null) {
      payload.status = booleanField(body, 'in_stock', false) ? 'ACTIVE' : 'OUT_OF_STOCK';
    }

    const { error } = await admin.from('products').update(payload).eq('product_id', productId);
    if (error) throw error;

    if (nextStock != null) {
      await setProductStock(productId, nextStock, locals.user.id);
    }

    const item = await getProductById(productId, locals.isAdmin);
    return json({ item }, { status: 200 });
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;
    if ((error as { code?: string })?.code === 'P0002') {
      return json({ error: 'Produsul nu a fost găsit.' }, { status: 404 });
    }

    const requestId = logRouteError('Product patch failed', error);
    return json({ error: 'Nu am putut actualiza produsul.', requestId }, { status: 400 });
  }
}

export async function DELETE({ locals, params }) {
  if (!locals.isAdmin || !locals.user) {
    return json({ error: 'Acces neautorizat.' }, { status: 401 });
  }

  try {
    const productId = requireNumericId(params.id, 'ID produs');
    const admin = createAdminClient();

    // Zero the stock through the ledger while the row is still visible
    // (setProductStock rejects soft-deleted products), then soft-delete.
    await setProductStock(productId, 0, locals.user.id, 'Produs șters');

    const { error } = await admin
      .from('products')
      .update({
        status: 'DISCONTINUED',
        deleted_at: new Date().toISOString(),
        updated_by_admin_id: locals.user.id,
      })
      .eq('product_id', productId)
      .is('deleted_at', null);
    if (error) throw error;
    return json({ success: true }, { status: 200 });
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;
    if ((error as { code?: string })?.code === 'P0002') {
      return json({ error: 'Produsul nu a fost găsit.' }, { status: 404 });
    }

    const requestId = logRouteError('Product delete failed', error);
    return json({ error: 'Nu am putut șterge produsul.', requestId }, { status: 400 });
  }
}
