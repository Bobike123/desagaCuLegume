import { json } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabase';

async function getOrCreateActiveCart(userId: number) {
  const admin = createAdminClient();
  const existing = await admin
    .from('carts')
    .select('cart_id, status')
    .eq('user_id', userId)
    .eq('status', 'ACTIVE')
    .maybeSingle();

  if (existing.error) throw existing.error;
  if (existing.data) return existing.data.cart_id as number;

  const created = await admin
    .from('carts')
    .insert({ user_id: userId, status: 'ACTIVE', currency_code: 'RON' })
    .select('cart_id')
    .single();

  if (created.error) throw created.error;
  return created.data.cart_id as number;
}

async function buildCartResponse(userId: number) {
  const admin = createAdminClient();
  const cartRow = await admin
    .from('carts')
    .select('cart_id')
    .eq('user_id', userId)
    .eq('status', 'ACTIVE')
    .maybeSingle();

  if (cartRow.error) throw cartRow.error;
  if (!cartRow.data) return { cartId: null, items: [] };

  const itemRows = await admin
    .from('cart_items')
    .select('cart_item_id, product_id, quantity, unit_price, currency_code')
    .eq('cart_id', cartRow.data.cart_id)
    .order('cart_item_id', { ascending: true });

  if (itemRows.error) throw itemRows.error;

  const productIds = (itemRows.data ?? []).map((row: any) => row.product_id);
  const productRows = productIds.length
    ? await admin.from('products').select('product_id, name, image_url').in('product_id', productIds)
    : { data: [], error: null };

  if (productRows.error) throw productRows.error;

  const productMap = new Map((productRows.data ?? []).map((row: any) => [row.product_id, row]));

  const items = (itemRows.data ?? []).map((row: any) => ({
    id: String(row.cart_item_id),
    productId: String(row.product_id),
    name: productMap.get(row.product_id)?.name ?? 'Produs',
    image_url: productMap.get(row.product_id)?.image_url ?? '',
    quantity: Number(row.quantity ?? 0),
    price: Number(row.unit_price ?? 0),
    currency_code: row.currency_code ?? 'RON',
  }));

  return { cartId: cartRow.data.cart_id, items };
}

async function replaceCartItems(userId: number, items: Array<{ productId: string; quantity: number }>) {
  const admin = createAdminClient();
  const cartId = await getOrCreateActiveCart(userId);

  const productIds = items.map((item) => Number(item.productId)).filter((value) => Number.isFinite(value));
  const { data: products, error: productsError } = await admin
    .from('products')
    .select('product_id, name, price, stock_quantity, status')
    .in('product_id', productIds);

  if (productsError) throw productsError;

  const productMap = new Map((products ?? []).map((row: any) => [String(row.product_id), row]));

  const prepared = items
    .map((item) => {
      const product = productMap.get(String(item.productId));
      const quantity = Math.max(0, Math.floor(item.quantity));
      if (!product || quantity <= 0) return null;
      if (product.status !== 'ACTIVE') throw new Error(`Produsul ${product.name} nu este activ.`);
      if (quantity > Number(product.stock_quantity ?? 0)) {
        throw new Error(`Stoc insuficient pentru ${product.name}.`);
      }
      return {
        cart_id: cartId,
        product_id: product.product_id,
        quantity,
        unit_price: Number(product.price ?? 0),
        currency_code: 'RON',
      };
    })
    .filter(Boolean) as Array<Record<string, unknown>>;

  const { error: deleteError } = await admin.from('cart_items').delete().eq('cart_id', cartId);
  if (deleteError) throw deleteError;

  if (prepared.length > 0) {
    const { error: insertError } = await admin.from('cart_items').insert(prepared);
    if (insertError) throw insertError;
  }

  return buildCartResponse(userId);
}

export async function GET({ locals }) {
  if (!locals.isAuthenticated || !locals.user) {
    return json({ authenticated: false, cartId: null, items: [] }, { status: 200 });
  }

  if (locals.isAdmin) {
    return json({ error: 'Adminii nu pot avea coș.' }, { status: 403 });
  }

  try {
    const payload = await buildCartResponse(locals.user.id);
    return json({ authenticated: true, ...payload }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load cart';
    return json({ error: message }, { status: 400 });
  }
}

export async function POST({ locals, request }) {
  if (!locals.isAuthenticated || !locals.user) {
    return json({ error: 'Autentificarea este necesară.' }, { status: 401 });
  }
  if (locals.isAdmin) {
    return json({ error: 'Adminii nu pot avea coș.' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const productId = String(body.productId ?? '').trim();
  const quantity = Math.max(1, Math.floor(Number(body.quantity ?? 1)));

  try {
    const current = await buildCartResponse(locals.user.id);
    const items = current.items.map((item) => ({ productId: item.productId, quantity: item.quantity }));
    const index = items.findIndex((item) => item.productId === productId);

    if (index >= 0) {
      items[index].quantity += quantity;
    } else {
      items.push({ productId, quantity });
    }

    const payload = await replaceCartItems(locals.user.id, items);
    return json(payload, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update cart';
    return json({ error: message }, { status: 400 });
  }
}

export async function PUT({ locals, request }) {
  if (!locals.isAuthenticated || !locals.user) {
    return json({ error: 'Autentificarea este necesară.' }, { status: 401 });
  }
  if (locals.isAdmin) {
    return json({ error: 'Adminii nu pot avea coș.' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const items = Array.isArray(body.items) ? body.items : [];

  try {
    const payload = await replaceCartItems(locals.user.id, items);
    return json(payload, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to sync cart';
    return json({ error: message }, { status: 400 });
  }
}

export async function DELETE({ locals }) {
  if (!locals.isAuthenticated || !locals.user) {
    return json({ error: 'Autentificarea este necesară.' }, { status: 401 });
  }
  if (locals.isAdmin) {
    return json({ error: 'Adminii nu pot avea coș.' }, { status: 403 });
  }

  try {
    const admin = createAdminClient();
    const cart = await admin
      .from('carts')
      .select('cart_id')
      .eq('user_id', locals.user.id)
      .eq('status', 'ACTIVE')
      .maybeSingle();

    if (cart.error) throw cart.error;
    if (cart.data) {
      const { error } = await admin.from('cart_items').delete().eq('cart_id', cart.data.cart_id);
      if (error) throw error;
    }

    return json({ success: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to clear cart';
    return json({ error: message }, { status: 400 });
  }
}

