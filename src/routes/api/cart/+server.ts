import { json } from '@sveltejs/kit';
import { logRouteError } from '$lib/server/log';
import { MAX_CART_QUANTITY } from '$lib/cart-limits';
import { normalizeCartItems } from '$lib/server/cart-validation';
import { DEFAULT_CATEGORY_SLUG, normalizeProductImageRows, type ProductImageRow } from '$lib/server/catalog';
import { mapRpcError } from '$lib/server/checkout-errors';
import type {
  AddCartItemArgs,
  CartRpcItemRow,
  CartRpcPayload,
  GetCartArgs,
  ReplaceCartItemsArgs,
} from '$lib/server/rpc-contracts';
import { createAdminClient } from '$lib/server/supabase';
import {
  arrayField,
  LIMITS,
  numberField,
  readJsonBody,
  requireNumericId,
  validationErrorResponse,
} from '$lib/server/validation';

function mapCartItem(row: CartRpcItemRow) {
  const images = normalizeProductImageRows((row.images ?? []) as ProductImageRow[], row.image_url);
  const stockQuantity = Number(row.stock_quantity ?? 0);
  const status = String(row.status ?? 'ACTIVE');

  return {
    id: String(row.cart_item_id),
    productId: String(row.product_id),
    name: row.name ?? 'Produs',
    image_url: images[0]?.url ?? row.image_url ?? '',
    images,
    measure_unit: row.measure_unit ?? 'PER_KG',
    promotion_label: row.promotion_label ?? 'NONE',
    quantity: Number(row.quantity ?? 0),
    price: Number(row.unit_price ?? 0),
    currency_code: row.currency_code ?? 'RON',
    category: row.category_slug ?? DEFAULT_CATEGORY_SLUG,
    stock_quantity: stockQuantity,
    in_stock: status === 'ACTIVE' && stockQuantity > 0,
  };
}

function mapCartPayload(payload: CartRpcPayload | null | undefined) {
  return {
    cartId: payload?.cart_id ?? null,
    items: Array.isArray(payload?.items) ? payload.items.map(mapCartItem) : [],
  };
}

async function fetchCart(userId: number) {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc('get_cart', { p_user_id: userId } satisfies GetCartArgs);
  if (error) throw error;
  return mapCartPayload(data as CartRpcPayload);
}

function cartErrorResponse(error: unknown, fallback: string) {
  const validation = validationErrorResponse(error);
  if (validation) return validation;

  const match = mapRpcError(error);
  if (match) return json({ error: match.error }, { status: match.status });

  const requestId = logRouteError('Cart request failed', error);
  return json({ error: fallback, requestId }, { status: 400 });
}

export async function GET({ locals }) {
  if (!locals.isAuthenticated || !locals.user) {
    return json({ authenticated: false, cartId: null, items: [] }, { status: 200 });
  }

  if (locals.isAdmin) {
    return json({ error: 'Adminii nu pot avea coș.' }, { status: 403 });
  }

  try {
    const payload = await fetchCart(locals.user.id);
    return json({ authenticated: true, ...payload }, { status: 200 });
  } catch (error) {
    return cartErrorResponse(error, 'Nu am putut încărca coșul.');
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

    // Single atomic RPC: increments under a product row lock and clamps to
    // stock/99. The previous read-merge-write here dropped concurrent adds.
    const admin = createAdminClient();
    const { data, error } = await admin.rpc('add_cart_item', {
      p_user_id: locals.user.id,
      p_product_id: Number(productId),
      p_delta: quantity,
    } satisfies AddCartItemArgs);

    if (error) throw error;

    const payload = data as CartRpcPayload;
    return json({ ...mapCartPayload(payload), clamped: payload?.clamped === true }, { status: 200 });
  } catch (error) {
    return cartErrorResponse(error, 'Nu am putut actualiza coșul.');
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

    const admin = createAdminClient();
    const { data, error } = await admin.rpc('replace_cart_items', {
      p_user_id: locals.user.id,
      p_items: items.map((item) => ({
        product_id: Number(item.productId),
        quantity: item.quantity,
      })),
    } satisfies ReplaceCartItemsArgs);

    if (error) throw error;

    // Since 20260702_01 the RPC clamps/drops unavailable lines instead of
    // rejecting the whole cart; surface what changed so the UI can tell the user.
    const payload = data as CartRpcPayload;
    return json(
      {
        ...mapCartPayload(payload),
        adjusted: {
          dropped: Array.isArray(payload?.dropped) ? payload.dropped.map(String) : [],
          clamped: Array.isArray(payload?.clamped) ? payload.clamped.map(String) : [],
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return cartErrorResponse(error, 'Nu am putut sincroniza coșul.');
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
    const requestId = logRouteError('Cart clear failed', error);
    return json({ error: 'Nu am putut goli coșul.', requestId }, { status: 400 });
  }
}
