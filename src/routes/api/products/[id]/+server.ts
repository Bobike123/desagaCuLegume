import { json } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabase';
import {
  ensureCategory,
  fetchCategoryMap,
  formatProductRow,
  isAllowedProductCategory,
  normalizeProductCategorySlug,
  PRODUCT_STATUSES,
} from '$lib/server/catalog';
import {
  booleanField,
  enumField,
  LIMITS,
  nullableStringField,
  numberField,
  optionalEnumField,
  readJsonBody,
  requireNumericId,
  safeUrl,
  stringField,
  validationErrorResponse,
} from '$lib/server/validation';

async function getProductById(id: string, includeHidden = false) {
  const productId = requireNumericId(id, 'ID produs');
  const admin = createAdminClient();
  let query = admin
    .from('products')
    .select('product_id, sku, slug, name, description, price, image_url, stock_quantity, status, created_at, updated_at, category_id')
    .eq('product_id', productId)
    .is('deleted_at', null);

  if (!includeHidden) {
    query = query.in('status', ['ACTIVE', 'OUT_OF_STOCK']);
  }

  const { data, error } = await query.maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const categoryMap = await fetchCategoryMap([data.category_id]);
  const item = formatProductRow(data, categoryMap.get(Number(data.category_id))?.slug);
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

    console.error('Product load failed', error);
    return json({ error: 'Nu am putut încărca produsul.' }, { status: 400 });
  }
}

export async function PUT({ locals, params, request }) {
  if (!locals.isAdmin || !locals.user) {
    return json({ error: 'Acces neautorizat.' }, { status: 401 });
  }

  try {
    const productId = requireNumericId(params.id, 'ID produs');
    const body = await readJsonBody(request, { maxBytes: LIMITS.smallJson });
    const admin = createAdminClient();
    const categorySlug = normalizeProductCategorySlug(
      stringField(body, 'category', { defaultValue: 'de-sezon', max: 80, fieldLabel: 'Categoria' })
    );

    if (!categorySlug) {
      return json({ error: 'Categoria trebuie să fie De sezon sau La borcan.' }, { status: 400 });
    }

    const category = await ensureCategory(categorySlug);
    const payload: Record<string, unknown> = {
      category_id: category.category_id,
      name: stringField(body, 'name', { required: true, max: 160, fieldLabel: 'Numele produsului' }),
      description: nullableStringField(body, 'description', { max: LIMITS.longText, fieldLabel: 'Descrierea' }),
      price: numberField(body, 'price', { required: true, min: 0, max: 100_000, fieldLabel: 'Prețul' }),
      image_url: safeUrl(body.image_url),
      stock_quantity: numberField(body, 'stock_quantity', {
        required: true,
        integer: true,
        min: 0,
        max: 100_000,
        fieldLabel: 'Stocul',
      }),
      status: enumField(body, 'status', PRODUCT_STATUSES, 'ACTIVE'),
      updated_by_admin_id: locals.user.id,
    };

    if (body.sku) payload.sku = stringField(body, 'sku', { max: 80, fieldLabel: 'SKU' });
    if (body.slug) payload.slug = stringField(body, 'slug', { max: 120, fieldLabel: 'Slug' });

    const { error } = await admin.from('products').update(payload).eq('product_id', productId);
    if (error) throw error;

    const item = await getProductById(productId, locals.isAdmin);
    return json({ item }, { status: 200 });
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    console.error('Product update failed', error);
    return json({ error: 'Nu am putut actualiza produsul.' }, { status: 400 });
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
    if (body.stock_quantity != null) {
      payload.stock_quantity = numberField(body, 'stock_quantity', {
        integer: true,
        min: 0,
        max: 100_000,
        fieldLabel: 'Stocul',
      });
    }
    if (body.price != null) {
      payload.price = numberField(body, 'price', { min: 0, max: 100_000, fieldLabel: 'Prețul' });
    }

    if (body.in_stock != null && body.status == null && body.stock_quantity == null) {
      payload.status = booleanField(body, 'in_stock', false) ? 'ACTIVE' : 'OUT_OF_STOCK';
    }

    const { error } = await admin.from('products').update(payload).eq('product_id', productId);
    if (error) throw error;

    const item = await getProductById(productId, locals.isAdmin);
    return json({ item }, { status: 200 });
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    console.error('Product patch failed', error);
    return json({ error: 'Nu am putut actualiza produsul.' }, { status: 400 });
  }
}

export async function DELETE({ locals, params }) {
  if (!locals.isAdmin) {
    return json({ error: 'Acces neautorizat.' }, { status: 401 });
  }

  try {
    const productId = requireNumericId(params.id, 'ID produs');
    const admin = createAdminClient();
    const { error } = await admin
      .from('products')
      .update({
        status: 'DISCONTINUED',
        stock_quantity: 0,
        deleted_at: new Date().toISOString(),
        updated_by_admin_id: locals.user?.id ?? null,
      })
      .eq('product_id', productId)
      .is('deleted_at', null);
    if (error) throw error;
    return json({ success: true }, { status: 200 });
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    console.error('Product delete failed', error);
    return json({ error: 'Nu am putut șterge produsul.' }, { status: 400 });
  }
}
