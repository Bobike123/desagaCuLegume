import { MAX_CART_QUANTITY } from '$lib/cart-limits';
import { isPlainObject, numberField, requireNumericId, RequestValidationError } from '$lib/server/validation';

export type CartItem = {
  productId: string;
  quantity: number;
};

export function normalizeCartItems(raw: unknown[]): CartItem[] {
  const normalized = raw.map((item, index) => {
    if (!isPlainObject(item)) {
      throw new RequestValidationError(`Produs invalid în coș la poziția ${index + 1}.`);
    }

    return {
      productId: requireNumericId(item.productId, 'ID produs'),
      quantity: numberField(item, 'quantity', {
        required: true,
        integer: true,
        min: 1,
        max: MAX_CART_QUANTITY,
        fieldLabel: 'Cantitatea',
      }),
    };
  });

  const quantities = new Map<string, number>();
  for (const item of normalized) {
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  }

  return [...quantities.entries()].map(([productId, quantity]) => ({
    productId,
    quantity: Math.min(quantity, MAX_CART_QUANTITY),
  }));
}
