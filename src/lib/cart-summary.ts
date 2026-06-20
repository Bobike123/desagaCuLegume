/**
 * Cart totals + delivery-fee rules for the checkout page (cos/+page.svelte).
 *
 * Pure and unit-testable. The delivery-fee rule mirrors the server-side
 * `place_order` RPC (free delivery at/above the threshold, otherwise a flat fee
 * for non-empty carts), so keep the two in sync.
 */
export const FREE_DELIVERY_THRESHOLD = 150;
export const DELIVERY_FEE = 20;

export type CartSummaryLine = { price: number; quantity: number };

export type CartSummary = {
  itemCount: number;
  subtotal: number;
  shippingFee: number;
  remainingForFreeDelivery: number;
  total: number;
};

export function computeCartSummary(
  items: readonly CartSummaryLine[],
  deliveryMethod: string
): CartSummary {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee =
    deliveryMethod === 'delivery'
      ? subtotal >= FREE_DELIVERY_THRESHOLD
        ? 0
        : subtotal > 0
          ? DELIVERY_FEE
          : 0
      : 0;
  const remainingForFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const total = subtotal + shippingFee;

  return { itemCount, subtotal, shippingFee, remainingForFreeDelivery, total };
}
