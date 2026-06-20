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
// src/routes/api/cart/+server.ts
export interface ReplaceCartItemsArgs {
  p_user_id: number;
  p_items: Array<{ product_id: number; quantity: number }>;
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
