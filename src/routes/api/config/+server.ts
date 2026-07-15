import { json } from '@sveltejs/kit';
import { DEFAULT_SHIPPING_RULES } from '$lib/cart-summary';
import { logRouteError } from '$lib/server/log';
import { publicCacheHeaders } from '$lib/server/pagination';
import { createAdminClient } from '$lib/server/supabase';

// Public storefront config. Shipping values come from app_shipping_rules
// (20260711_09) - the same row place_order charges from - so the cart display
// can never drift from what customers actually pay.
export async function GET({ setHeaders }) {
  setHeaders(publicCacheHeaders());

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('app_shipping_rules')
      .select('free_delivery_threshold, delivery_fee')
      .eq('id', 1)
      .maybeSingle();

    if (error) throw error;

    return json({
      shipping: {
        freeDeliveryThreshold: Number(data?.free_delivery_threshold ?? DEFAULT_SHIPPING_RULES.freeDeliveryThreshold),
        deliveryFee: Number(data?.delivery_fee ?? DEFAULT_SHIPPING_RULES.deliveryFee),
      },
    });
  } catch (error) {
    logRouteError('Config load failed', error);
    // Display falls back to the compiled defaults; checkout still charges
    // whatever place_order reads from the table.
    return json({ shipping: { ...DEFAULT_SHIPPING_RULES } });
  }
}
