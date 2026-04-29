import { json } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabase';

type CheckoutItem = {
  productId: string;
  quantity: number;
};

function normalizeItems(raw: unknown): CheckoutItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => ({
      productId: String((item as any)?.productId ?? '').trim(),
      quantity: Math.max(0, Math.floor(Number((item as any)?.quantity ?? 0))),
    }))
    .filter((item) => item.productId && item.quantity > 0);
}

function buildOrderNumber() {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${stamp}-${suffix}`;
}

function defaultPickupAddress(fullName: string) {
  return {
    full_name: fullName || 'Ridicare din rulota DeSaga',
    line1: 'Ridicare din rulota DeSaga',
    line2: null,
    city: 'Cluj-Napoca',
    state_region: 'Cluj',
    postal_code: '400000',
    country_code: 'RO',
  };
}

export async function POST({ locals, request }) {
  if (!locals.isAuthenticated || !locals.user) {
    return json({ error: 'Autentificarea este necesară pentru checkout.' }, { status: 401 });
  }

  if (locals.isAdmin) {
    return json({ error: 'Adminii nu pot face comenzi.' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const items = normalizeItems(body.items);

  if (items.length === 0) {
    return json({ error: 'Coșul este gol.' }, { status: 400 });
  }

  const fullName = String(body.fullName ?? locals.user.fullName ?? '').trim();
  const phone = String(body.phone ?? locals.user.phone ?? '').trim();
  const deliveryMethod = String(body.deliveryMethod ?? 'pickup') === 'delivery' ? 'delivery' : 'pickup';
  const customerMessage = String(body.customerMessage ?? '').trim();
  const paymentMethod = String(body.paymentMethod ?? 'CASH_ON_DELIVERY');

  if (!fullName) {
    return json({ error: 'Numele complet este obligatoriu.' }, { status: 400 });
  }

  if (!phone) {
    return json({ error: 'Telefonul este obligatoriu.' }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const productIds = items.map((item) => Number(item.productId)).filter((value) => Number.isFinite(value));
    const { data: productRows, error: productError } = await admin
      .from('products')
      .select('product_id, sku, name, price, stock_quantity, status')
      .in('product_id', productIds);

    if (productError) throw productError;

    const productMap = new Map((productRows ?? []).map((row: any) => [String(row.product_id), row]));
    const preparedItems = items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new Error(`Produsul ${item.productId} nu există.`);
      }
      if (product.status !== 'ACTIVE') {
        throw new Error(`Produsul ${product.name} nu este disponibil.`);
      }
      if (item.quantity > Number(product.stock_quantity ?? 0)) {
        throw new Error(`Stoc insuficient pentru ${product.name}.`);
      }
      return {
        product,
        quantity: item.quantity,
        unitPrice: Number(product.price ?? 0),
        lineTotal: Number(product.price ?? 0) * item.quantity,
      };
    });

    const subtotal = preparedItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const shippingAmount = deliveryMethod === 'delivery' ? (subtotal >= 150 ? 0 : 20) : 0;
    const taxAmount = 0;
    const discountAmount = 0;
    const totalAmount = subtotal + shippingAmount + taxAmount - discountAmount;

    const existingCart = await admin
      .from('carts')
      .select('cart_id')
      .eq('user_id', locals.user.id)
      .eq('status', 'ACTIVE')
      .maybeSingle();

    if (existingCart.error) throw existingCart.error;

    let cartId = existingCart.data?.cart_id ?? null;

    if (!cartId) {
      const cartCreate = await admin
        .from('carts')
        .insert({ user_id: locals.user.id, status: 'ACTIVE', currency_code: 'RON' })
        .select('cart_id')
        .single();

      if (cartCreate.error) throw cartCreate.error;
      cartId = cartCreate.data.cart_id;
    }

    if (!cartId) {
      throw new Error('Nu s-a putut crea coșul de checkout.');
    }

    const { error: deleteCartItemsError } = await admin.from('cart_items').delete().eq('cart_id', cartId);
    if (deleteCartItemsError) throw deleteCartItemsError;

    const { error: insertCartItemsError } = await admin.from('cart_items').insert(
      preparedItems.map((item) => ({
        cart_id: cartId,
        product_id: item.product.product_id,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        currency_code: 'RON',
      }))
    );
    if (insertCartItemsError) throw insertCartItemsError;

    const billingAddress = {
      user_id: locals.user.id,
      label: 'Billing',
      full_name: fullName,
      phone,
      line1: String(body.addressLine1 ?? '').trim() || (deliveryMethod === 'pickup' ? defaultPickupAddress(fullName).line1 : ''),
      line2: String(body.addressLine2 ?? '').trim() || null,
      city: String(body.city ?? '').trim() || (deliveryMethod === 'pickup' ? defaultPickupAddress(fullName).city : ''),
      state_region: String(body.stateRegion ?? '').trim() || (deliveryMethod === 'pickup' ? defaultPickupAddress(fullName).state_region : null),
      postal_code: String(body.postalCode ?? '').trim() || (deliveryMethod === 'pickup' ? defaultPickupAddress(fullName).postal_code : ''),
      country_code: String(body.countryCode ?? 'RO').trim() || 'RO',
      is_default: true,
    };

    if (deliveryMethod === 'delivery' && (!billingAddress.line1 || !billingAddress.city || !billingAddress.postal_code)) {
      return json({ error: 'Adresa de livrare este incompletă.' }, { status: 400 });
    }

    const shippingSeed = deliveryMethod === 'delivery' ? billingAddress : { ...billingAddress, ...defaultPickupAddress(fullName) };

    const billingAddressResult = await admin.from('user_addresses').insert(billingAddress).select('address_id').single();
    if (billingAddressResult.error) throw billingAddressResult.error;

    const shippingAddressResult = await admin.from('user_addresses').insert({
      ...shippingSeed,
      user_id: locals.user.id,
      label: deliveryMethod === 'delivery' ? 'Shipping' : 'Pickup',
      is_default: false,
    }).select('address_id').single();
    if (shippingAddressResult.error) throw shippingAddressResult.error;

    const checkoutResult = await admin
      .from('checkouts')
      .insert({
        user_id: locals.user.id,
        cart_id: cartId,
        status: 'COMPLETED',
        billing_address_id: billingAddressResult.data.address_id,
        shipping_address_id: shippingAddressResult.data.address_id,
        subtotal_amount: subtotal,
        tax_amount: taxAmount,
        shipping_amount: shippingAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        currency_code: 'RON',
        completed_at: new Date().toISOString(),
      })
      .select('checkout_id')
      .single();

    if (checkoutResult.error) throw checkoutResult.error;

    const orderNumber = buildOrderNumber();
    const shippingAddress = shippingSeed;

    const orderResult = await admin
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: locals.user.id,
        checkout_id: checkoutResult.data.checkout_id,
        status: 'PLACED',
        payment_status: 'PENDING',
        fulfillment_status: 'UNFULFILLED',
        customer_email: locals.user.email,
        customer_full_name: fullName,
        customer_phone: phone,
        billing_full_name: billingAddress.full_name,
        billing_line1: billingAddress.line1,
        billing_line2: billingAddress.line2,
        billing_city: billingAddress.city,
        billing_state_region: billingAddress.state_region,
        billing_postal_code: billingAddress.postal_code,
        billing_country_code: billingAddress.country_code,
        shipping_full_name: shippingAddress.full_name,
        shipping_line1: shippingAddress.line1,
        shipping_line2: shippingAddress.line2,
        shipping_city: shippingAddress.city,
        shipping_state_region: shippingAddress.state_region,
        shipping_postal_code: shippingAddress.postal_code,
        shipping_country_code: shippingAddress.country_code,
        subtotal_amount: subtotal,
        tax_amount: taxAmount,
        shipping_amount: shippingAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        currency_code: 'RON',
        notes: customerMessage || null,
        placed_at: new Date().toISOString(),
      })
      .select('order_id, order_number, status, payment_status, fulfillment_status, total_amount, currency_code, created_at')
      .single();

    if (orderResult.error) throw orderResult.error;

    const { error: orderItemsError } = await admin.from('order_items').insert(
      preparedItems.map((item) => ({
        order_id: orderResult.data.order_id,
        product_id: item.product.product_id,
        sku: item.product.sku,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        line_total: item.lineTotal,
        currency_code: 'RON',
      }))
    );
    if (orderItemsError) throw orderItemsError;

    const { error: paymentError } = await admin.from('payments').insert({
      order_id: orderResult.data.order_id,
      payment_method: paymentMethod,
      status: 'PENDING',
      amount: totalAmount,
      currency_code: 'RON',
      provider_name: deliveryMethod === 'pickup' ? 'PICKUP' : 'DELIVERY',
      provider_payload: { deliveryMethod },
    });
    if (paymentError) throw paymentError;

    const { error: closeCartError } = await admin
      .from('carts')
      .update({ status: 'CHECKED_OUT', updated_at: new Date().toISOString() })
      .eq('cart_id', cartId);
    if (closeCartError) throw closeCartError;

    for (const item of preparedItems) {
      const nextStock = Math.max(0, Number(item.product.stock_quantity ?? 0) - item.quantity);
      const nextStatus = nextStock > 0 ? item.product.status : 'OUT_OF_STOCK';
      const stockUpdate = await admin
        .from('products')
        .update({ stock_quantity: nextStock, status: nextStatus })
        .eq('product_id', item.product.product_id);
      if (stockUpdate.error) throw stockUpdate.error;
    }

    if (customerMessage) {
      const conversationResult = await admin
        .from('support_conversations')
        .insert({
          user_id: locals.user.id,
          subject: `Comandă ${orderNumber}`,
          status: 'OPEN',
        })
        .select('conversation_id')
        .single();
      if (conversationResult.error) throw conversationResult.error;

      const { error: messageError } = await admin.from('support_messages').insert({
        conversation_id: conversationResult.data.conversation_id,
        sender_user_id: locals.user.id,
        sender_type: 'USER',
        message_body: customerMessage,
        is_read: false,
      });
      if (messageError) throw messageError;
    }

    return json(
      {
        success: true,
        order: {
          id: String(orderResult.data.order_id),
          orderNumber: orderResult.data.order_number,
          status: orderResult.data.status,
          paymentStatus: orderResult.data.payment_status,
          fulfillmentStatus: orderResult.data.fulfillment_status,
          total: Number(orderResult.data.total_amount),
          currency: orderResult.data.currency_code,
          createdAt: orderResult.data.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Checkout failed';
    return json({ error: message }, { status: 400 });
  }
}

