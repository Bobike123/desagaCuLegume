/**
 * Typed contracts for the Supabase RPC functions called by server code.
 *
 * These functions are defined in the canonical Supabase migration. The
 * `supabase-js` client here is created without a generated `Database` type, so
 * `.rpc(name, args)` is effectively untyped. These interfaces document the exact
 * argument and row shapes the application relies on so call sites can be checked
 * with `satisfies` / casts instead of `any`.
 *
 * Keep in sync with the call sites and `supabase/migrations`.
 */

// --- replace_cart_items (no runtime fallback) ------------------------------
// src/routes/api/cart/+server.ts — returns CartRpcPayload with dropped/clamped
// product-id arrays since 20260702_01.
export interface ReplaceCartItemsArgs {
  p_user_id: number;
  p_items: Array<{ product_id: number; quantity: number }>;
}

// --- get_cart / add_cart_item (no runtime fallback) -------------------------
// src/routes/api/cart/+server.ts — defined in 20260702_01_cart_upsert.sql.
export interface GetCartArgs {
  p_user_id: number;
}

export interface AddCartItemArgs {
  p_user_id: number;
  p_product_id: number;
  p_delta: number;
}

export interface CartRpcItemRow {
  cart_item_id: number | string;
  product_id: number | string;
  name?: string | null;
  image_url?: string | null;
  measure_unit?: string | null;
  promotion_label?: string | null;
  images?: unknown[] | null;
  quantity?: number | string | null;
  unit_price?: number | string | null;
  currency_code?: string | null;
  category_slug?: string | null;
  status?: string | null;
  stock_quantity?: number | string | null;
}

export interface CartRpcPayload {
  cart_id: number | null;
  items: CartRpcItemRow[];
  // add_cart_item: boolean; replace_cart_items: array of clamped product ids.
  clamped?: boolean | Array<number | string>;
  dropped?: Array<number | string>;
}

// --- admin_dashboard_stats (no runtime fallback) -----------------------------
// src/routes/api/admin/stats/+server.ts — defined in 20260711_08_admin_stats_rpc.sql.
export interface AdminDashboardStatsRow {
  products: number | string;
  orders: number | string;
  conversations: number | string;
  unread_messages: number | string;
  horeca_requests: number | string;
  new_horeca_requests: number | string;
  security_unread: number | string;
  security_decoy_hits_24h: number | string;
  security_rate_limits_24h: number | string;
  failed_logins_24h: number | string;
}

// --- admin_set_product_stock (no runtime fallback) --------------------------
// src/routes/api/products/*+server.ts — defined in 20260702_02_stock_ledger.sql.
export interface AdminSetProductStockArgs {
  p_product_id: number;
  p_new_quantity: number;
  p_admin_user_id: number;
  p_note: string | null;
}

// --- support_conversation_summaries (no runtime fallback) ------------------
// src/lib/server/support.ts — return row is the local `SupportSummaryRow`.
export interface SupportConversationSummariesArgs {
  p_viewer_user_id: number | null;
  p_is_admin: boolean;
  p_status: string | null;
  p_topic: string | null;
  p_search: string | null;
  p_limit: number;
  p_offset: number;
}

// --- update_order_admin (no runtime fallback) ------------------------------
// src/routes/api/orders/[id]/+server.ts — return row consumed by `mapOrder`.
export interface UpdateOrderAdminArgs {
  p_order_id: number;
  p_admin_user_id: number | null;
  p_status: string | null;
  p_payment_status: string | null;
  p_fulfillment_status: string | null;
  p_note: string | null;
}

export interface UpdateOrderAdminRow {
  order_id: number;
  order_number: string;
  user_id: number | null;
  customer_full_name: string | null;
  customer_email: string | null;
  total_amount: number | string | null;
  currency_code: string | null;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  created_at: string | null;
  placed_at: string | null;
}

// --- resolve_session (has runtime fallback: multi-query lookup) ------------
// src/lib/server/auth.ts
export interface ResolveSessionArgs {
  p_token_hash: string;
}

export interface ResolveSessionRow {
  session_id: string;
  user_id: number;
  expires_at: string;
  last_activity_at: string;
  [key: string]: unknown;
}

// --- consume_rate_limit (has runtime fallback: in-memory buckets) ----------
// src/lib/server/rate-limit.ts
export interface ConsumeRateLimitArgs {
  p_key: string;
  p_limit: number;
  p_window_seconds: number;
}

export interface ConsumeRateLimitRow {
  allowed: boolean;
  remaining: number;
  retry_after_seconds: number;
}

// --- consume_rate_limits (batch; fallback: in-memory buckets) ---------------
// src/lib/server/rate-limit.ts — defined in 20260710_06_rate_limit_batch.sql.
export interface ConsumeRateLimitsArgs {
  p_checks: Array<{ key: string; limit: number; window_seconds: number }>;
}

export interface ConsumeRateLimitsRow {
  key: string;
  allowed: boolean;
  remaining: number;
  retry_after_seconds: number;
}

// --- peek_rate_limit / reset_rate_limit (fallback: in-memory buckets) ------
// src/lib/server/rate-limit.ts — login lockout counters.
export interface PeekRateLimitArgs {
  p_key: string;
  p_limit: number;
}

export interface PeekRateLimitRow {
  allowed: boolean;
  retry_after_seconds: number;
}

export interface ResetRateLimitArgs {
  p_key: string;
}
