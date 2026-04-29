import { json } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabase';
import { ensureCategory, fetchCategoryMap, formatProductRow } from '$lib/server/catalog';

async function getProductById(id: string, includeHidden = false) {
  const admin = createAdminClient();
  let query = admin
    .from('products')
    .select('product_id, sku, slug, name, description, price, image_url, stock_quantity, status, created_at, updated_at, category_id')
    .eq('product_id', id);

  if (!includeHidden) {
    query = query.in('status', ['ACTIVE', 'OUT_OF_STOCK']);
  }

  const { data, error } = await query.maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const categoryMap = await fetchCategoryMap([data.category_id]);
  return formatProductRow(data, categoryMap.get(Number(data.category_id))?.slug);
}

export async function GET({ params, locals }) {
  try {
    const item = await getProductById(params.id, locals.isAdmin);
    if (!item) return json({ error: 'Produsul nu a fost găsit.' }, { status: 404 });
    return json({ item }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load product';
    return json({ error: message }, { status: 400 });
  }
}

export async function PUT({ locals, params, request }) {
  if (!locals.isAdmin || !locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  try {
    const admin = createAdminClient();
    const category = await ensureCategory(String(body.category ?? 'de-sezon'));
    const payload: Record<string, unknown> = {
      category_id: category.category_id,
      name: String(body.name ?? '').trim(),
      description: String(body.description ?? '').trim() || null,
      price: Number(body.price ?? 0),
      image_url: String(body.image_url ?? '').trim() || null,
      stock_quantity: Math.max(0, Number(body.stock_quantity ?? 0)),
      status: String(body.status ?? 'ACTIVE').trim() || 'ACTIVE',
      updated_by_admin_id: locals.user.id,
    };

    if (body.sku) payload.sku = String(body.sku).trim();
    if (body.slug) payload.slug = String(body.slug).trim();

    const { error } = await admin.from('products').update(payload).eq('product_id', params.id);
    if (error) throw error;

    const item = await getProductById(params.id, locals.isAdmin);
    return json({ item }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update product';
    return json({ error: message }, { status: 400 });
  }
}

export async function PATCH({ locals, params, request }) {
  if (!locals.isAdmin || !locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  try {
    const admin = createAdminClient();
    const payload: Record<string, unknown> = {
      updated_by_admin_id: locals.user.id,
    };

    if (body.status) payload.status = String(body.status);
    if (body.stock_quantity != null) payload.stock_quantity = Math.max(0, Number(body.stock_quantity));
    if (body.price != null) payload.price = Number(body.price);

    if (body.in_stock != null && body.status == null && body.stock_quantity == null) {
      payload.status = body.in_stock ? 'ACTIVE' : 'OUT_OF_STOCK';
    }

    const { error } = await admin.from('products').update(payload).eq('product_id', params.id);
    if (error) throw error;

    const item = await getProductById(params.id, locals.isAdmin);
    return json({ item }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update product';
    return json({ error: message }, { status: 400 });
  }
}

export async function DELETE({ locals, params }) {
  if (!locals.isAdmin) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.from('products').delete().eq('product_id', params.id);
    if (error) throw error;
    return json({ success: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete product';
    return json({ error: message }, { status: 400 });
  }
}
