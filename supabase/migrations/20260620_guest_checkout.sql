begin;

alter table public.checkouts
  alter column user_id drop not null;

alter table public.orders
  alter column user_id drop not null,
  alter column customer_email drop not null;

alter table public.checkout_idempotency_keys
  drop constraint if exists checkout_idempotency_keys_pkey;

alter table public.checkout_idempotency_keys
  alter column user_id drop not null,
  add column if not exists scope_key text;

update public.checkout_idempotency_keys
set scope_key = coalesce('user:' || user_id::text, 'legacy-order:' || order_id::text)
where scope_key is null;

alter table public.checkout_idempotency_keys
  alter column scope_key set not null,
  add constraint checkout_idempotency_keys_pkey primary key (scope_key, idempotency_key);

create index if not exists checkout_idempotency_keys_user_idx
  on public.checkout_idempotency_keys(user_id)
  where user_id is not null;

drop index if exists public.orders_user_id_idempotency_key_uidx;

create unique index orders_user_id_idempotency_key_uidx
  on public.orders(user_id, idempotency_key)
  where idempotency_key is not null and user_id is not null;

create unique index if not exists orders_guest_idempotency_key_uidx
  on public.orders(idempotency_key)
  where idempotency_key is not null and user_id is null;

create or replace function public.validate_user_is_customer()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.user_id is null then
    return new;
  end if;

  if public.user_has_role(new.user_id, 'ADMIN'::public.role_name) then
    raise exception 'Administratorii nu pot folosi această resursă.';
  end if;
  return new;
end;
$$;

drop function if exists public.place_order(
  bigint,
  jsonb,
  text,
  text,
  text,
  public.payment_method_type,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  uuid
);

drop function if exists public.place_order(
  bigint,
  jsonb,
  text,
  text,
  text,
  text,
  public.payment_method_type,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  uuid
);

create function public.place_order(
  p_user_id bigint,
  p_items jsonb,
  p_full_name text,
  p_phone text,
  p_email text default null,
  p_delivery_method text default 'pickup',
  p_payment_method public.payment_method_type default 'CASH_ON_DELIVERY',
  p_address_line1 text default null,
  p_address_line2 text default null,
  p_city text default null,
  p_state_region text default null,
  p_postal_code text default null,
  p_country_code text default 'RO',
  p_customer_message text default null,
  p_idempotency_key uuid default null
)
returns table (
  order_id bigint,
  order_number varchar(40),
  status public.order_status,
  payment_status public.payment_status,
  fulfillment_status public.fulfillment_status,
  total_amount numeric(12, 2),
  currency_code varchar(3),
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  app_user public.users%rowtype;
  raw_item jsonb;
  raw_product_id text;
  raw_quantity text;
  parsed_product_id bigint;
  parsed_quantity integer;
  v_item_count integer;
  v_product_count integer := 0;
  locked_product record;
  existing_order_id bigint;
  v_cart_id bigint;
  v_billing_address_id bigint;
  v_shipping_address_id bigint;
  v_checkout_id bigint;
  v_support_conversation_id bigint;
  v_order_id bigint;
  v_order_number varchar(40);
  v_delivery_method text;
  v_full_name text;
  v_phone text;
  v_customer_email text;
  v_idempotency_scope text;
  v_country_code_text text;
  v_country_code char(2);
  v_billing_line1 text;
  v_billing_line2 text;
  v_billing_city text;
  v_billing_state_region text;
  v_billing_postal_code text;
  v_shipping_line1 text;
  v_shipping_line2 text;
  v_shipping_city text;
  v_shipping_state_region text;
  v_shipping_postal_code text;
  v_currency varchar(3);
  v_subtotal numeric(12, 2) := 0;
  v_tax_amount numeric(12, 2) := 0;
  v_shipping_amount numeric(12, 2) := 0;
  v_discount_amount numeric(12, 2) := 0;
  v_total_amount numeric(12, 2) := 0;
begin
  v_full_name := nullif(btrim(coalesce(p_full_name, '')), '');
  v_phone := nullif(btrim(coalesce(p_phone, '')), '');
  v_customer_email := nullif(lower(btrim(coalesce(p_email, ''))), '');
  v_delivery_method := lower(coalesce(nullif(btrim(coalesce(p_delivery_method, '')), ''), 'pickup'));
  v_country_code_text := upper(coalesce(nullif(btrim(coalesce(p_country_code, '')), ''), 'RO'));

  if v_full_name is null then
    raise exception 'Full name is required.';
  end if;
  if v_phone is null then
    raise exception 'Phone is required.';
  end if;
  if v_customer_email is not null and v_customer_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Email is invalid.';
  end if;
  if v_delivery_method not in ('pickup', 'delivery') then
    raise exception 'Delivery method is invalid.';
  end if;
  if v_country_code_text !~ '^[A-Z]{2}$' then
    raise exception 'Country code is invalid.';
  end if;

  if p_user_id is not null then
    select * into app_user
    from public.users u
    where u.user_id = p_user_id
      and u.status = 'ACTIVE'
      and u.deleted_at is null;

    if not found then
      raise exception 'Checkout requires an active user.';
    end if;

    if public.user_has_role(p_user_id, 'ADMIN'::public.role_name) then
      raise exception 'Admins cannot place orders.';
    end if;

    v_customer_email := coalesce(v_customer_email, app_user.email);
    v_idempotency_scope := 'user:' || p_user_id::text;
  else
    v_idempotency_scope := 'guest:' || md5(coalesce(v_customer_email, '') || ':' || v_phone || ':' || v_full_name);
  end if;

  if p_idempotency_key is not null then
    perform pg_advisory_xact_lock(hashtextextended(v_idempotency_scope || ':' || p_idempotency_key::text, 0));

    select cik.order_id into existing_order_id
    from public.checkout_idempotency_keys cik
    where cik.scope_key = v_idempotency_scope
      and cik.idempotency_key = p_idempotency_key::text;

    if existing_order_id is not null then
      return query
      select o.order_id, o.order_number, o.status, o.payment_status, o.fulfillment_status, o.total_amount, o.currency_code, o.created_at
      from public.orders o
      where o.order_id = existing_order_id;
      return;
    end if;
  end if;

  v_country_code := v_country_code_text::char(2);

  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'Checkout items must be a JSON array.';
  end if;

  drop table if exists pg_temp.checkout_rpc_items;
  drop table if exists pg_temp.checkout_rpc_products;

  create temporary table checkout_rpc_items (
    product_id bigint primary key,
    quantity integer not null check (quantity > 0 and quantity <= 99)
  ) on commit drop;

  create temporary table checkout_rpc_products (
    product_id bigint primary key,
    sku varchar(80) not null,
    product_name varchar(200) not null,
    quantity integer not null,
    unit_price numeric(12, 2) not null,
    line_total numeric(12, 2) not null,
    currency_code varchar(3) not null
  ) on commit drop;

  for raw_item in select value from jsonb_array_elements(p_items) as item(value)
  loop
    if jsonb_typeof(raw_item) <> 'object' then
      raise exception 'Invalid checkout item payload.';
    end if;

    raw_product_id := coalesce(raw_item ->> 'productId', raw_item ->> 'product_id');
    raw_quantity := raw_item ->> 'quantity';

    if raw_product_id is null or raw_product_id !~ '^[0-9]+$' or raw_quantity is null or raw_quantity !~ '^[0-9]+$' then
      raise exception 'Invalid checkout item payload.';
    end if;

    parsed_product_id := raw_product_id::bigint;
    parsed_quantity := raw_quantity::integer;

    if parsed_quantity < 1 or parsed_quantity > 99 then
      raise exception 'Item quantity must be between 1 and 99.';
    end if;

    insert into checkout_rpc_items(product_id, quantity)
    values (parsed_product_id, parsed_quantity)
    on conflict (product_id) do update
      set quantity = least(99, checkout_rpc_items.quantity + excluded.quantity);
  end loop;

  select count(*) into v_item_count from checkout_rpc_items;
  if v_item_count = 0 then
    raise exception 'Checkout requires at least one item.';
  end if;
  if v_item_count > 100 then
    raise exception 'Checkout cannot contain more than 100 distinct products.';
  end if;

  for locked_product in
    select p.product_id, p.sku, p.name, p.price, p.currency_code, p.stock_quantity, p.status, i.quantity
    from checkout_rpc_items i
    join public.products p on p.product_id = i.product_id
    where p.deleted_at is null
    order by p.product_id
    for update of p
  loop
    v_product_count := v_product_count + 1;

    if locked_product.status <> 'ACTIVE'::public.product_status then
      raise exception 'Product is not available.';
    end if;
    if locked_product.stock_quantity < locked_product.quantity then
      raise exception 'Insufficient stock for one or more products.';
    end if;

    if v_currency is null then
      v_currency := locked_product.currency_code;
    elsif v_currency <> locked_product.currency_code then
      raise exception 'Mixed currency checkout is not supported.';
    end if;

    insert into checkout_rpc_products(product_id, sku, product_name, quantity, unit_price, line_total, currency_code)
    values (
      locked_product.product_id,
      locked_product.sku,
      locked_product.name,
      locked_product.quantity,
      locked_product.price,
      locked_product.price * locked_product.quantity,
      locked_product.currency_code
    );
  end loop;

  if v_product_count <> v_item_count then
    raise exception 'Product no longer exists.';
  end if;

  select coalesce(sum(rp.line_total), 0)::numeric(12, 2) into v_subtotal
  from checkout_rpc_products rp;
  v_currency := coalesce(v_currency, 'RON');
  if v_delivery_method = 'delivery' then
    v_shipping_amount := case when v_subtotal >= 150 then 0 else 20 end;
  end if;
  v_total_amount := v_subtotal + v_shipping_amount + v_tax_amount - v_discount_amount;

  if v_delivery_method = 'pickup' then
    v_billing_line1 := 'Ridicare din rulota DeSaga';
    v_billing_line2 := null;
    v_billing_city := 'Cluj-Napoca';
    v_billing_state_region := 'Cluj';
    v_billing_postal_code := '400000';
    v_shipping_line1 := v_billing_line1;
    v_shipping_line2 := null;
    v_shipping_city := v_billing_city;
    v_shipping_state_region := v_billing_state_region;
    v_shipping_postal_code := v_billing_postal_code;
  else
    v_billing_line1 := nullif(btrim(coalesce(p_address_line1, '')), '');
    v_billing_line2 := nullif(btrim(coalesce(p_address_line2, '')), '');
    v_billing_city := nullif(btrim(coalesce(p_city, '')), '');
    v_billing_state_region := nullif(btrim(coalesce(p_state_region, '')), '');
    v_billing_postal_code := nullif(btrim(coalesce(p_postal_code, '')), '');

    if v_billing_line1 is null or v_billing_city is null or v_billing_postal_code is null then
      raise exception 'Delivery address is incomplete.';
    end if;

    v_shipping_line1 := v_billing_line1;
    v_shipping_line2 := v_billing_line2;
    v_shipping_city := v_billing_city;
    v_shipping_state_region := v_billing_state_region;
    v_shipping_postal_code := v_billing_postal_code;
  end if;

  if p_user_id is not null then
    select c.cart_id into v_cart_id
    from public.carts c
    where c.user_id = p_user_id and c.status = 'ACTIVE'
    order by c.cart_id desc
    limit 1
    for update;

    if v_cart_id is null then
      insert into public.carts(user_id, status, currency_code)
      values (p_user_id, 'ACTIVE', v_currency)
      returning cart_id into v_cart_id;
    end if;

    delete from public.cart_items where cart_id = v_cart_id;
    insert into public.cart_items(cart_id, product_id, quantity)
    select v_cart_id, rp.product_id, rp.quantity
    from checkout_rpc_products rp
    order by rp.product_id;

    insert into public.user_addresses(user_id, label, full_name, phone, line1, line2, city, state_region, postal_code, country_code, is_default)
    values (p_user_id, 'Facturare', v_full_name, v_phone, v_billing_line1, v_billing_line2, v_billing_city, v_billing_state_region, v_billing_postal_code, v_country_code, false)
    returning address_id into v_billing_address_id;

    insert into public.user_addresses(user_id, label, full_name, phone, line1, line2, city, state_region, postal_code, country_code, is_default)
    values (p_user_id, case when v_delivery_method = 'delivery' then 'Livrare' else 'Ridicare' end, v_full_name, v_phone, v_shipping_line1, v_shipping_line2, v_shipping_city, v_shipping_state_region, v_shipping_postal_code, v_country_code, false)
    returning address_id into v_shipping_address_id;
  end if;

  insert into public.checkouts(user_id, cart_id, status, billing_address_id, shipping_address_id, subtotal_amount, tax_amount, shipping_amount, discount_amount, total_amount, currency_code, completed_at)
  values (p_user_id, v_cart_id, 'COMPLETED', v_billing_address_id, v_shipping_address_id, v_subtotal, v_tax_amount, v_shipping_amount, v_discount_amount, v_total_amount, v_currency, now())
  returning checkout_id into v_checkout_id;

  v_order_number := public.generate_order_number();

  insert into public.orders(
    order_number, user_id, checkout_id, status, payment_status, fulfillment_status,
    customer_email, customer_full_name, customer_phone,
    billing_full_name, billing_line1, billing_line2, billing_city, billing_state_region, billing_postal_code, billing_country_code,
    shipping_full_name, shipping_line1, shipping_line2, shipping_city, shipping_state_region, shipping_postal_code, shipping_country_code,
    subtotal_amount, tax_amount, shipping_amount, discount_amount, total_amount, currency_code, notes, placed_at, idempotency_key
  )
  values (
    v_order_number, p_user_id, v_checkout_id, 'PLACED', 'PENDING', 'UNFULFILLED',
    v_customer_email, v_full_name, v_phone,
    v_full_name, v_billing_line1, v_billing_line2, v_billing_city, v_billing_state_region, v_billing_postal_code, v_country_code,
    v_full_name, v_shipping_line1, v_shipping_line2, v_shipping_city, v_shipping_state_region, v_shipping_postal_code, v_country_code,
    v_subtotal, v_tax_amount, v_shipping_amount, v_discount_amount, v_total_amount, v_currency, nullif(btrim(coalesce(p_customer_message, '')), ''), now(), p_idempotency_key
  )
  returning orders.order_id into v_order_id;

  if p_idempotency_key is not null then
    insert into public.checkout_idempotency_keys(scope_key, idempotency_key, user_id, order_id)
    values (v_idempotency_scope, p_idempotency_key::text, p_user_id, v_order_id);
  end if;

  insert into public.order_status_history(order_id, old_status, new_status, changed_by_user_id, note)
  values (v_order_id, null, 'PLACED', null, 'Comandă plasată de client.');

  insert into public.order_items(order_id, product_id, sku, product_name, quantity, unit_price, line_total, currency_code)
  select v_order_id, rp.product_id, rp.sku, rp.product_name, rp.quantity, rp.unit_price, rp.line_total, rp.currency_code
  from checkout_rpc_products rp
  order by rp.product_id;

  insert into public.payments(order_id, payment_method, status, amount, currency_code, provider_name, provider_payload)
  values (v_order_id, p_payment_method, 'PENDING', v_total_amount, v_currency, upper(v_delivery_method), jsonb_build_object('deliveryMethod', v_delivery_method));

  insert into public.inventory_movements(product_id, movement_type, quantity, note, created_by_admin_id)
  select rp.product_id, 'OUT', rp.quantity, 'Checkout order ' || v_order_number, null
  from checkout_rpc_products rp
  order by rp.product_id;

  update public.products p
  set status = 'OUT_OF_STOCK'
  from checkout_rpc_products rp
  where p.product_id = rp.product_id
    and p.stock_quantity = 0
    and p.status = 'ACTIVE';

  if v_cart_id is not null then
    update public.carts set status = 'CHECKED_OUT' where cart_id = v_cart_id;
  end if;

  if p_user_id is not null and nullif(btrim(coalesce(p_customer_message, '')), '') is not null then
    insert into public.support_conversations(user_id, subject, status, order_id, topic)
    values (p_user_id, 'Comandă #' || v_order_number, 'OPEN', v_order_id, 'ORDER')
    returning conversation_id into v_support_conversation_id;

    insert into public.support_messages(conversation_id, sender_user_id, sender_type, message_body, is_read)
    values (v_support_conversation_id, p_user_id, 'USER', nullif(btrim(coalesce(p_customer_message, '')), ''), false);
  end if;

  return query
  select o.order_id, o.order_number, o.status, o.payment_status, o.fulfillment_status, o.total_amount, o.currency_code, o.created_at
  from public.orders o
  where o.order_id = v_order_id;
end;
$$;

grant execute on function public.place_order(
  bigint,
  jsonb,
  text,
  text,
  text,
  text,
  public.payment_method_type,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  uuid
) to service_role;

commit;
