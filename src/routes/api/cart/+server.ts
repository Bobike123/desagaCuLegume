import { json } from '@sveltejs/kit';
import { MAX_CART_QUANTITY } from '$lib/cart-limits';
import { normalizeCartItems, type CartItem } from '$lib/server/cart-validation';
import type { ReplaceCartItemsArgs } from '$lib/server/rpc-contracts';
import { createAdminClient } from '$lib/server/supabase';
import {
  arrayField,
  LIMITS,
  numberField,
  readJsonBody,
  requireNumericId,
  validationErrorResponse,
} from '$lib/server/validation';

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

async function replaceCartItems(userId: number, items: CartItem[]) {
  const admin = createAdminClient();
  const { error } = await admin.rpc('replace_cart_items', {
    p_user_id: userId,
    p_items: items.map((item) => ({
      product_id: Number(item.productId),
      quantity: item.quantity,
    })),
  } satisfies ReplaceCartItemsArgs);

  if (error) {
    throw new Error(
      `Cart transaction failed: ${error.message}. Run the provided replace_cart_items SQL function before production use.`
    );
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
    console.error('Cart load failed', error);
    return json({ error: 'Nu am putut încărca coșul.' }, { status: 400 });
  }
}

export async function POST({ locals, request }) {
  if (!locals.isAuthenticated || !locals.user) {
    return json({ error: 'Autentificarea este necesară.' }, { status: 401 });
  }
  if (locals.isAdmin) {
    return json({ error: 'Adminii nu pot avea coș.' }, { status: 403 });
  }

  try {
    const body = await readJsonBody(request, { maxBytes: LIMITS.tinyJson });
    const productId = requireNumericId(body.productId, 'ID produs');
    const quantity = numberField(body, 'quantity', {
      defaultValue: 1,
      integer: true,
      min: 1,
      max: MAX_CART_QUANTITY,
      fieldLabel: 'Cantitatea',
    });

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
    const validation = validationErrorResponse(error);
    if (validation) return validation;
    console.error('Cart update failed', error);
    return json({ error: 'Nu am putut actualiza coșul.' }, { status: 400 });
  }
}

export async function PUT({ locals, request }) {
  if (!locals.isAuthenticated || !locals.user) {
    return json({ error: 'Autentificarea este necesară.' }, { status: 401 });
  }
  if (locals.isAdmin) {
    return json({ error: 'Adminii nu pot avea coș.' }, { status: 403 });
  }

  try {
    const body = await readJsonBody(request, { maxBytes: LIMITS.smallJson });
    const items = normalizeCartItems(arrayField(body, 'items', 100));
    const payload = await replaceCartItems(locals.user.id, items);
    return json(payload, { status: 200 });
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    console.error('Cart sync failed', error);
    return json({ error: 'Nu am putut sincroniza coșul.' }, { status: 400 });
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
    console.error('Cart clear failed', error);
    return json({ error: 'Nu am putut goli coșul.' }, { status: 400 });
  }
}
