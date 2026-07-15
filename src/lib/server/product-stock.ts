import type { AdminSetProductStockArgs } from '$lib/server/rpc-contracts';
import { createAdminClient } from '$lib/server/supabase';

/**
 * Sets a product's stock through the inventory ledger (admin_set_product_stock
 * RPC, 20260702_02): the delta is recorded as an inventory_movements row and
 * the trigger applies it, so SUM(movements) reconciles with
 * products.stock_quantity. Never write stock_quantity directly from routes -
 * that bypasses the ledger and desyncs it.
 *
 * Returns the resulting stock quantity.
 */
export async function setProductStock(
  productId: number | string,
  newQuantity: number,
  adminUserId: number,
  note: string | null = null
) {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc('admin_set_product_stock', {
    p_product_id: Number(productId),
    p_new_quantity: newQuantity,
    p_admin_user_id: adminUserId,
    p_note: note,
  } satisfies AdminSetProductStockArgs);

  if (error) throw error;
  return Number(data ?? newQuantity);
}
