/**
 * Cart totals + delivery-fee rules for the checkout page (cos/+page.svelte).
 *
 * Pure and unit-testable. The authoritative rule lives in the
 * app_shipping_rules table (read by the place_order RPC); the page fetches it
 * via GET /api/config and passes it in. The constants below are only the
 * compiled fallback for when that fetch has not resolved / failed - they must
 * match the table's seeded defaults.
 */
export const FREE_DELIVERY_THRESHOLD = 150;
export const DELIVERY_FEE = 20;

export type ShippingRules = {
  freeDeliveryThreshold: number;
  deliveryFee: number;
};

export const DEFAULT_SHIPPING_RULES: ShippingRules = {
  freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
  deliveryFee: DELIVERY_FEE,
};

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
  deliveryMethod: string,
  rules: ShippingRules = DEFAULT_SHIPPING_RULES
): CartSummary {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee =
    deliveryMethod === 'delivery'
      ? subtotal >= rules.freeDeliveryThreshold
        ? 0
        : subtotal > 0
          ? rules.deliveryFee
          : 0
      : 0;
  const remainingForFreeDelivery = Math.max(0, rules.freeDeliveryThreshold - subtotal);
  const total = subtotal + shippingFee;

  return { itemCount, subtotal, shippingFee, remainingForFreeDelivery, total };
}
