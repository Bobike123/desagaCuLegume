-- ============================================================================
-- apply_missing_cloud_migrations.sql  (generated 2026-07-03)
-- The cloud project danxizzqkzwhsrdfsegv was seeded from export/schema_only.sql,
-- which predates the migrations below. All statements are idempotent, so
-- re-running is safe. Run this whole file in the Supabase Dashboard SQL editor.
-- If 'create extension pg_cron' is refused, enable it first under
-- Dashboard -> Database -> Extensions, then re-run that section.
-- ============================================================================


-- >>>>>>>>>> migrations/20260702_01_cart_upsert.sql >>>>>>>>>>
-- ============================================================================
-- 20260702_01_cart_upsert.sql
-- 1) Hardens function EXECUTE privileges (closes the PUBLIC-grant hole).
-- 2) get_cart(p_user_id)          - single-query cart read with product state.
-- 3) add_cart_item(...)           - atomic add/increment (fixes the lost-update
--                                    race in POST /api/cart read-merge-write).
-- 4) replace_cart_items(...) v2   - clamps quantities / drops dead lines and
--                                    reports them instead of rejecting the
--                                    whole cart when one product is bad.
-- Notes:
--   * cart_items already has the unique index uq_cart_product_once
--     (cart_id, product_id), so ON CONFLICT works and cart_id lookups are
--     covered by its leading column. No new constraint needed.
--   * Deploy order: run this file, then deploy the updated /api/cart route.
--     The old route keeps working while this SQL is live (it only uses
--     replace_cart_items, whose argument list is unchanged).
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1) Function privilege hardening.
-- Postgres grants EXECUTE on new functions to PUBLIC by default, and the base
-- migration's "revoke ... from anon, authenticated" does not remove a PUBLIC
-- grant. Without this block, the anon API key can call SECURITY DEFINER RPCs
-- such as grant_admin_role or place_order directly via PostgREST /rpc.
-- ---------------------------------------------------------------------------

revoke execute on all functions in schema public from public, anon, authenticated;

-- service_role is the only role the app server uses; make sure it can run
-- every app function (some later migrations forgot per-function grants and
-- were only working through the PUBLIC default we just revoked).
grant execute on all functions in schema public to service_role;

-- The RLS policies reference exactly these two helpers for anon/authenticated.
grant execute on function public.current_app_user_id() to anon, authenticated;
grant execute on function public.current_app_is_admin() to anon, authenticated;

-- Future functions created from the SQL editor should not get the PUBLIC grant.
alter default privileges in schema public revoke execute on functions from public;

-- ---------------------------------------------------------------------------
-- 1b) Make sure the (cart_id, product_id) unique index exists - ON CONFLICT
--     below depends on it. The base schema creates it as uq_cart_product_once;
--     recreate defensively in case the live DB drifted. Duplicate rows (if
--     any) are merged by summing quantities into the oldest row first.
-- ---------------------------------------------------------------------------

with ranked as (
  select cart_item_id,
         cart_id,
         product_id,
         quantity,
         min(cart_item_id) over (partition by cart_id, product_id) as keeper_id,
         sum(quantity) over (partition by cart_id, product_id) as total_quantity
  from public.cart_items
)
update public.cart_items ci
set quantity = least(99, r.total_quantity)
from ranked r
where ci.cart_item_id = r.keeper_id
  and r.cart_item_id = r.keeper_id
  and ci.quantity <> least(99, r.total_quantity);

delete from public.cart_items ci
using (
  select cart_item_id,
         min(cart_item_id) over (partition by cart_id, product_id) as keeper_id
  from public.cart_items
) d
where ci.cart_item_id = d.cart_item_id
  and d.cart_item_id <> d.keeper_id;

create unique index if not exists uq_cart_product_once
  on public.cart_items(cart_id, product_id);

-- ---------------------------------------------------------------------------
-- 2) get_cart - one round-trip cart payload including live product state
--    (category slug, status, stock), replacing the app's 3-query read and the
--    hardcoded in_stock/category values on cart restore.
-- ---------------------------------------------------------------------------

create or replace function public.get_cart(p_user_id bigint)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (
      select jsonb_build_object(
        'cart_id', c.cart_id,
        'items', coalesce(
          (
            select jsonb_agg(
              jsonb_build_object(
                'cart_item_id', ci.cart_item_id,
                'product_id', ci.product_id,
                'name', p.name,
                'image_url', coalesce(p.image_url, ''),
                'measure_unit', p.measure_unit,
                'promotion_label', p.promotion_label,
                'images', coalesce(
                  (
                    select jsonb_agg(
                      jsonb_build_object(
                        'product_image_id', pi.product_image_id,
                        'image_url', pi.image_url,
                        'alt_text', pi.alt_text,
                        'sort_order', pi.sort_order,
                        'is_primary', pi.is_primary
                      )
                      order by pi.is_primary desc, pi.sort_order
                    )
                    from public.product_images pi
                    where pi.product_id = p.product_id
                  ),
                  '[]'::jsonb
                ),
                'quantity', ci.quantity,
                'unit_price', ci.unit_price,
                'currency_code', ci.currency_code,
                'category_slug', pc.slug,
                'status', p.status,
                'stock_quantity', p.stock_quantity
              )
              order by ci.cart_item_id
            )
            from public.cart_items ci
            join public.products p on p.product_id = ci.product_id
            left join public.product_categories pc on pc.category_id = p.category_id
            where ci.cart_id = c.cart_id
          ),
          '[]'::jsonb
        )
      )
      from public.carts c
      where c.user_id = p_user_id
        and c.status = 'ACTIVE'
      order by c.cart_id desc
      limit 1
    ),
    jsonb_build_object('cart_id', null, 'items', '[]'::jsonb)
  );
$$;

-- ---------------------------------------------------------------------------
-- 3) add_cart_item - atomic increment under the same per-user advisory lock
--    used by replace_cart_items. The product row is locked FOR UPDATE, the
--    quantity is clamped to LEAST(99, stock, current + delta), and the upsert
--    goes through the uq_cart_product_once unique index. Two concurrent adds
--    can no longer overwrite each other.
-- ---------------------------------------------------------------------------

create or replace function public.add_cart_item(
  p_user_id bigint,
  p_product_id bigint,
  p_delta integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  app_user public.users%rowtype;
  product_row public.products%rowtype;
  v_cart_id bigint;
  v_existing integer;
  v_requested integer;
  v_next integer;
begin
  if p_user_id is null then
    raise exception 'Utilizatorul nu este activ.';
  end if;
  if p_delta is null or p_delta < 1 or p_delta > 99 then
    raise exception 'Cantitatea trebuie să fie între 1 și 99.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('cart:' || p_user_id::text, 0));

  select * into app_user
  from public.users
  where user_id = p_user_id
    and status = 'ACTIVE'
    and deleted_at is null;

  if not found then
    raise exception 'Utilizatorul nu este activ.';
  end if;

  if public.user_has_role(p_user_id, 'ADMIN'::public.role_name) then
    raise exception 'Administratorii nu pot avea coș.';
  end if;

  select * into product_row
  from public.products
  where product_id = p_product_id
    and deleted_at is null
  for update;

  if not found then
    raise exception 'Product no longer exists.';
  end if;
  if product_row.status <> 'ACTIVE'::public.product_status then
    raise exception 'Product is not available.';
  end if;
  if product_row.stock_quantity < 1 then
    raise exception 'Insufficient stock for one or more products.';
  end if;

  select c.cart_id into v_cart_id
  from public.carts c
  where c.user_id = p_user_id
    and c.status = 'ACTIVE'
  order by c.cart_id desc
  limit 1
  for update;

  if v_cart_id is null then
    insert into public.carts(user_id, status, currency_code)
    values (p_user_id, 'ACTIVE', product_row.currency_code)
    returning cart_id into v_cart_id;
  end if;

  select ci.quantity into v_existing
  from public.cart_items ci
  where ci.cart_id = v_cart_id
    and ci.product_id = p_product_id;

  v_requested := coalesce(v_existing, 0) + p_delta;
  v_next := least(99, product_row.stock_quantity, v_requested);

  insert into public.cart_items(cart_id, product_id, quantity)
  values (v_cart_id, p_product_id, v_next)
  on conflict (cart_id, product_id) do update
    set quantity = excluded.quantity;

  return public.get_cart(p_user_id)
    || jsonb_build_object('clamped', v_next < v_requested);
end;
$$;

-- ---------------------------------------------------------------------------
-- 4) replace_cart_items v2 - same signature, new return type (void → jsonb),
--    so the old function must be dropped first. Instead of raising when any
--    line is unavailable or over stock, it now:
--      * drops lines whose product is missing / deleted / inactive / stock 0,
--      * clamps remaining quantities to LEAST(99, stock),
--      * reports both lists so the client can tell the user what changed.
-- ---------------------------------------------------------------------------

drop function if exists public.replace_cart_items(bigint, jsonb);

create function public.replace_cart_items(p_user_id bigint, p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  app_user public.users%rowtype;
  raw_item jsonb;
  parsed_product_id bigint;
  parsed_quantity integer;
  v_item_count integer;
  v_cart_id bigint;
  v_currency varchar(3);
  v_dropped jsonb;
  v_clamped jsonb;
begin
  perform pg_advisory_xact_lock(hashtextextended('cart:' || p_user_id::text, 0));

  select * into app_user
  from public.users
  where user_id = p_user_id
    and status = 'ACTIVE'
    and deleted_at is null;

  if not found then
    raise exception 'Utilizatorul nu este activ.';
  end if;

  if public.user_has_role(p_user_id, 'ADMIN'::public.role_name) then
    raise exception 'Administratorii nu pot avea coș.';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'Coșul trebuie să fie o listă de produse.';
  end if;

  drop table if exists pg_temp.cart_rpc_items;
  drop table if exists pg_temp.cart_rpc_resolved;

  create temporary table cart_rpc_items (
    product_id bigint primary key,
    quantity integer not null check (quantity > 0 and quantity <= 99)
  ) on commit drop;

  for raw_item in select value from jsonb_array_elements(p_items) as item(value)
  loop
    if jsonb_typeof(raw_item) <> 'object'
      or coalesce(raw_item ->> 'product_id', raw_item ->> 'productId', '') !~ '^[0-9]+$'
      or coalesce(raw_item ->> 'quantity', '') !~ '^[0-9]+$' then
      raise exception 'Produs invalid în coș.';
    end if;

    parsed_product_id := coalesce(raw_item ->> 'product_id', raw_item ->> 'productId')::bigint;
    parsed_quantity := (raw_item ->> 'quantity')::integer;

    if parsed_quantity < 1 or parsed_quantity > 99 then
      raise exception 'Cantitatea trebuie să fie între 1 și 99.';
    end if;

    insert into cart_rpc_items(product_id, quantity)
    values (parsed_product_id, parsed_quantity)
    on conflict (product_id) do update
      set quantity = least(99, cart_rpc_items.quantity + excluded.quantity);
  end loop;

  select count(*) into v_item_count from cart_rpc_items;
  if v_item_count > 100 then
    raise exception 'Coșul nu poate conține peste 100 de produse distincte.';
  end if;

  -- Lock referenced product rows in a stable order (same as place_order) so
  -- stock cannot shift between the availability check and the insert below.
  perform 1
  from public.products p
  where p.product_id in (select product_id from pg_temp.cart_rpc_items)
  order by p.product_id
  for update;

  create temporary table cart_rpc_resolved on commit drop as
  select
    i.product_id,
    i.quantity as requested_quantity,
    (
      p.product_id is not null
      and p.deleted_at is null
      and p.status = 'ACTIVE'::public.product_status
      and p.stock_quantity > 0
    ) as available,
    least(i.quantity, coalesce(p.stock_quantity, 0)) as final_quantity
  from pg_temp.cart_rpc_items i
  left join public.products p on p.product_id = i.product_id;

  select coalesce(jsonb_agg(r.product_id order by r.product_id), '[]'::jsonb)
  into v_dropped
  from cart_rpc_resolved r
  where not r.available;

  select coalesce(jsonb_agg(r.product_id order by r.product_id), '[]'::jsonb)
  into v_clamped
  from cart_rpc_resolved r
  where r.available
    and r.final_quantity < r.requested_quantity;

  select min(p.currency_code)
  into v_currency
  from cart_rpc_resolved r
  join public.products p on p.product_id = r.product_id
  where r.available;

  select c.cart_id into v_cart_id
  from public.carts c
  where c.user_id = p_user_id
    and c.status = 'ACTIVE'
  order by c.cart_id desc
  limit 1
  for update;

  if v_cart_id is null then
    insert into public.carts(user_id, status, currency_code)
    values (p_user_id, 'ACTIVE', coalesce(v_currency, 'RON'))
    returning cart_id into v_cart_id;
  end if;

  delete from public.cart_items where cart_id = v_cart_id;

  insert into public.cart_items(cart_id, product_id, quantity)
  select v_cart_id, r.product_id, r.final_quantity
  from cart_rpc_resolved r
  where r.available
  order by r.product_id;

  return public.get_cart(p_user_id)
    || jsonb_build_object('dropped', v_dropped, 'clamped', v_clamped);
end;
$$;

-- ---------------------------------------------------------------------------
-- Privileges for the new/recreated functions (PUBLIC default already revoked
-- above; be explicit anyway).
-- ---------------------------------------------------------------------------

revoke execute on function public.get_cart(bigint) from public, anon, authenticated;
revoke execute on function public.add_cart_item(bigint, bigint, integer) from public, anon, authenticated;
revoke execute on function public.replace_cart_items(bigint, jsonb) from public, anon, authenticated;
grant execute on function public.get_cart(bigint) to service_role;
grant execute on function public.add_cart_item(bigint, bigint, integer) to service_role;
grant execute on function public.replace_cart_items(bigint, jsonb) to service_role;

commit;

-- ============================================================================
-- VERIFY (run manually after applying):
--
-- 1) Privilege hole is closed (expect only current_app_* rows):
--    see step 4 of 20260702_00_verify_rls_readonly.sql
--
-- 2) Concurrent adds sum instead of overwriting - in two SQL editor tabs run
--    simultaneously (replace 1/2 with a real user_id/product_id):
--      select public.add_cart_item(1, 2, 1);
--    Final quantity must equal the number of calls (capped by stock/99).
--
-- 3) replace_cart_items keeps good lines when one product is dead:
--      select public.replace_cart_items(1, '[{"product_id": 2, "quantity": 3},
--                                            {"product_id": 999999, "quantity": 1}]'::jsonb);
--    Expect: "dropped": [999999] and the cart still contains product 2.
-- ============================================================================


-- >>>>>>>>>> migrations/20260702_02_stock_ledger.sql >>>>>>>>>>
-- ============================================================================
-- 20260702_02_stock_ledger.sql
-- Makes inventory_movements the single source of truth for stock changes.
--
-- 1) apply_inventory_movement(): an OUT movement that brings stock to 0 now
--    also flips status ACTIVE → OUT_OF_STOCK (previously only place_order did
--    this manually; place_order's own update simply becomes a no-op).
--    An IN movement already flips OUT_OF_STOCK → ACTIVE, so a restock through
--    the ledger re-activates the product automatically.
-- 2) admin_set_product_stock(): the only way the app sets stock from the
--    admin panel. Computes the delta against the locked row and records it as
--    an inventory_movements row; the trigger applies the change, so
--    SUM(movements) always reconciles with products.stock_quantity.
--
-- The 'ADJUSTMENT' enum value stays unused by design: signed IN/OUT rows keep
-- the trigger arithmetic trivial and the ledger auditable.
--
-- Deploy order: run this file, then deploy the updated product admin routes.
-- ============================================================================

begin;

create or replace function public.apply_inventory_movement()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.movement_type = 'IN'::public.inventory_movement_type then
    update public.products
    set stock_quantity = stock_quantity + new.quantity,
        status = case when status = 'OUT_OF_STOCK' then 'ACTIVE'::public.product_status else status end
    where product_id = new.product_id;
  elsif new.movement_type = 'OUT'::public.inventory_movement_type then
    update public.products
    set stock_quantity = stock_quantity - new.quantity,
        status = case
          when stock_quantity - new.quantity = 0 and status = 'ACTIVE'::public.product_status
            then 'OUT_OF_STOCK'::public.product_status
          else status
        end
    where product_id = new.product_id
      and stock_quantity >= new.quantity;

    if not found then
      raise exception 'Insufficient stock for one or more products.';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.admin_set_product_stock(
  p_product_id bigint,
  p_new_quantity integer,
  p_admin_user_id bigint,
  p_note text default null
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  product_row public.products%rowtype;
  v_delta integer;
  v_result integer;
begin
  if p_admin_user_id is null
    or not public.user_has_role(p_admin_user_id, 'ADMIN'::public.role_name) then
    raise exception 'Utilizatorul nu este administrator.';
  end if;

  if p_new_quantity is null or p_new_quantity < 0 or p_new_quantity > 100000 then
    raise exception 'Stocul trebuie să fie între 0 și 100000.';
  end if;

  select * into product_row
  from public.products
  where product_id = p_product_id
    and deleted_at is null
  for update;

  if not found then
    raise exception 'Produsul nu a fost găsit.' using errcode = 'P0002';
  end if;

  v_delta := p_new_quantity - product_row.stock_quantity;

  if v_delta = 0 then
    return product_row.stock_quantity;
  end if;

  insert into public.inventory_movements(product_id, movement_type, quantity, note, created_by_admin_id)
  values (
    p_product_id,
    case when v_delta > 0 then 'IN'::public.inventory_movement_type else 'OUT'::public.inventory_movement_type end,
    abs(v_delta),
    coalesce(nullif(btrim(coalesce(p_note, '')), ''), 'Ajustare stoc admin'),
    p_admin_user_id
  );

  select stock_quantity into v_result
  from public.products
  where product_id = p_product_id;

  return v_result;
end;
$$;

revoke execute on function public.admin_set_product_stock(bigint, integer, bigint, text) from public, anon, authenticated;
grant execute on function public.admin_set_product_stock(bigint, integer, bigint, text) to service_role;

commit;

-- ============================================================================
-- VERIFY (run manually after applying; replace ids with real ones):
--
-- 1) Admin stock edit produces a ledger row and the trigger applies it:
--      select public.admin_set_product_stock(2, 15, <admin_user_id>, 'test');
--      select stock_quantity, status from public.products where product_id = 2;
--      select * from public.inventory_movements
--        where product_id = 2 order by movement_id desc limit 1;
--
-- 2) Ledger reconciles with the column (expect zero rows):
--      select p.product_id, p.stock_quantity,
--             coalesce(sum(case when m.movement_type = 'IN' then m.quantity
--                               when m.movement_type = 'OUT' then -m.quantity
--                               else 0 end), 0) as ledger_total
--      from public.products p
--      left join public.inventory_movements m on m.product_id = p.product_id
--      group by p.product_id, p.stock_quantity
--      having p.stock_quantity <> coalesce(sum(case when m.movement_type = 'IN' then m.quantity
--                                                   when m.movement_type = 'OUT' then -m.quantity
--                                                   else 0 end), 0);
--    NOTE: pre-existing products created with direct stock writes will show up
--    until their next admin stock edit; the check holds for all rows going
--    forward once routes use admin_set_product_stock.
--
-- 3) Selling out via checkout flips status (place an order that empties stock,
--    then):
--      select status from public.products where product_id = <id>; -- OUT_OF_STOCK
-- ============================================================================


-- >>>>>>>>>> migrations/20260702_03_orders_delivery_and_transitions.sql >>>>>>>>>>
-- ============================================================================
-- 20260702_03_orders_delivery_and_transitions.sql
-- 1) orders.delivery_method becomes a first-class column (it was smuggled
--    through payments.provider_payload and reverse-engineered on read).
-- 2) assert_order_transition() - order status state machine; update_order_admin
--    now rejects nonsense transitions (e.g. DELIVERED → PENDING).
-- 3) update_order_admin also writes payments.status when p_payment_status is
--    given, and the payments→orders sync trigger fires only on real status
--    changes (and never against update_order_admin itself), so a stale
--    payments row can no longer clobber an admin edit.
-- 4) place_order recreated to fill orders.delivery_method (it keeps writing
--    provider_payload for one release for backward compatibility).
--
-- Deploy order: run this file, then deploy the updated orders route code.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1) delivery_method column + backfill from payments.provider_payload
-- ---------------------------------------------------------------------------

alter table public.orders
  add column if not exists delivery_method text not null default 'pickup';

alter table public.orders
  drop constraint if exists orders_delivery_method_check;

alter table public.orders
  add constraint orders_delivery_method_check
  check (delivery_method in ('pickup', 'delivery'));

update public.orders o
set delivery_method = 'delivery'
from public.payments p
where p.order_id = o.order_id
  and p.provider_payload ->> 'deliveryMethod' = 'delivery'
  and o.delivery_method <> 'delivery';

-- ---------------------------------------------------------------------------
-- 2) Order status state machine (COD flow).
--    PENDING   → PLACED, CANCELLED
--    PLACED    → PAID, PROCESSING, CANCELLED
--    PAID      → PROCESSING, SHIPPED, CANCELLED, REFUNDED
--    PROCESSING→ SHIPPED, DELIVERED, CANCELLED
--    SHIPPED   → DELIVERED, CANCELLED
--    DELIVERED → COMPLETED, REFUNDED
--    COMPLETED → REFUNDED
--    CANCELLED / REFUNDED are terminal. Same-status updates are no-ops.
-- ---------------------------------------------------------------------------

create or replace function public.assert_order_transition(
  p_old public.order_status,
  p_new public.order_status
)
returns void
language plpgsql
immutable
as $$
declare
  allowed boolean;
begin
  if p_old is null or p_new is null or p_old = p_new then
    return;
  end if;

  allowed := case p_old
    when 'PENDING'::public.order_status then p_new in ('PLACED', 'CANCELLED')
    when 'PLACED'::public.order_status then p_new in ('PAID', 'PROCESSING', 'CANCELLED')
    when 'PAID'::public.order_status then p_new in ('PROCESSING', 'SHIPPED', 'CANCELLED', 'REFUNDED')
    when 'PROCESSING'::public.order_status then p_new in ('SHIPPED', 'DELIVERED', 'CANCELLED')
    when 'SHIPPED'::public.order_status then p_new in ('DELIVERED', 'CANCELLED')
    when 'DELIVERED'::public.order_status then p_new in ('COMPLETED', 'REFUNDED')
    when 'COMPLETED'::public.order_status then p_new in ('REFUNDED')
    else false
  end;

  if not allowed then
    raise exception 'Tranziție de status invalidă: % → %.', p_old, p_new
      using errcode = 'P0003';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3a) payments → orders sync: skip-guard + fire only on real status changes.
--     The old single trigger fired on any payments update and unconditionally
--     rewrote orders.payment_status, racing with admin edits.
-- ---------------------------------------------------------------------------

create or replace function public.sync_order_payment_status()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if current_setting('app.skip_payment_sync', true) = 'on' then
    return new;
  end if;

  update public.orders
  set payment_status = new.status,
      paid_at = case when new.status = 'PAID' then coalesce(new.paid_at, now()) else paid_at end
  where order_id = new.order_id;

  return new;
end;
$$;

drop trigger if exists trg_sync_order_payment_status on public.payments;
drop trigger if exists trg_sync_order_payment_status_ins on public.payments;
drop trigger if exists trg_sync_order_payment_status_upd on public.payments;

create trigger trg_sync_order_payment_status_ins
  after insert on public.payments
  for each row execute function public.sync_order_payment_status();

create trigger trg_sync_order_payment_status_upd
  after update of status on public.payments
  for each row
  when (old.status is distinct from new.status)
  execute function public.sync_order_payment_status();

-- ---------------------------------------------------------------------------
-- 3b) update_order_admin: enforce transitions + keep payments row in sync.
--     Same signature and return type as before → create or replace.
-- ---------------------------------------------------------------------------

create or replace function public.update_order_admin(
  p_order_id bigint,
  p_admin_user_id bigint default null,
  p_status text default null,
  p_payment_status text default null,
  p_fulfillment_status text default null,
  p_note text default null
)
returns table (
  order_id bigint,
  order_number varchar,
  user_id bigint,
  customer_full_name varchar,
  customer_email varchar,
  total_amount numeric,
  currency_code varchar,
  status public.order_status,
  payment_status public.payment_status,
  fulfillment_status public.fulfillment_status,
  created_at timestamptz,
  placed_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  existing public.orders%rowtype;
  next_status public.order_status;
  next_payment_status public.payment_status;
  next_fulfillment_status public.fulfillment_status;
begin
  select * into existing
  from public.orders o
  where o.order_id = p_order_id
  for update;

  if not found then
    raise exception 'Comanda nu a fost găsită.' using errcode = 'P0002';
  end if;

  if p_admin_user_id is not null and not public.user_has_role(p_admin_user_id, 'ADMIN'::public.role_name) then
    raise exception 'Utilizatorul nu este administrator.';
  end if;

  next_status := coalesce(upper(nullif(btrim(p_status), ''))::public.order_status, existing.status);
  next_payment_status := coalesce(upper(nullif(btrim(p_payment_status), ''))::public.payment_status, existing.payment_status);
  next_fulfillment_status := coalesce(upper(nullif(btrim(p_fulfillment_status), ''))::public.fulfillment_status, existing.fulfillment_status);

  perform public.assert_order_transition(existing.status, next_status);

  perform set_config('app.skip_order_status_history', 'on', true);
  perform set_config('app.skip_payment_sync', 'on', true);

  update public.orders o
  set status = next_status,
      payment_status = next_payment_status,
      fulfillment_status = next_fulfillment_status,
      paid_at = case when next_payment_status = 'PAID' then coalesce(o.paid_at, now()) else o.paid_at end,
      shipped_at = case when next_status = 'SHIPPED' then coalesce(o.shipped_at, now()) else o.shipped_at end,
      delivered_at = case when next_status in ('DELIVERED', 'COMPLETED') then coalesce(o.delivered_at, now()) else o.delivered_at end,
      cancelled_at = case when next_status = 'CANCELLED' then coalesce(o.cancelled_at, now()) else o.cancelled_at end
  where o.order_id = p_order_id;

  if p_payment_status is not null and existing.payment_status is distinct from next_payment_status then
    update public.payments pay
    set status = next_payment_status,
        paid_at = case when next_payment_status = 'PAID' then coalesce(pay.paid_at, now()) else pay.paid_at end
    where pay.order_id = p_order_id;
  end if;

  if existing.status is distinct from next_status then
    insert into public.order_status_history(order_id, old_status, new_status, changed_by_user_id, note)
    values (
      p_order_id,
      existing.status,
      next_status,
      p_admin_user_id,
      nullif(btrim(coalesce(p_note, '')), '')
    );
  end if;

  return query
  select
    o.order_id,
    o.order_number,
    o.user_id,
    o.customer_full_name,
    o.customer_email,
    o.total_amount,
    o.currency_code,
    o.status,
    o.payment_status,
    o.fulfillment_status,
    o.created_at,
    o.placed_at
  from public.orders o
  where o.order_id = p_order_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4) place_order: identical to the 20260620 definition except the orders
--    insert now also fills delivery_method. Same signature → create or replace.
-- ---------------------------------------------------------------------------

create or replace function public.place_order(
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
    -- Shipping rule duplicated client-side in src/lib/cart-summary.ts
    -- (FREE_SHIPPING_THRESHOLD = 150, SHIPPING_FEE = 20). Keep in sync.
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
    subtotal_amount, tax_amount, shipping_amount, discount_amount, total_amount, currency_code, notes, placed_at, idempotency_key,
    delivery_method
  )
  values (
    v_order_number, p_user_id, v_checkout_id, 'PLACED', 'PENDING', 'UNFULFILLED',
    v_customer_email, v_full_name, v_phone,
    v_full_name, v_billing_line1, v_billing_line2, v_billing_city, v_billing_state_region, v_billing_postal_code, v_country_code,
    v_full_name, v_shipping_line1, v_shipping_line2, v_shipping_city, v_shipping_state_region, v_shipping_postal_code, v_country_code,
    v_subtotal, v_tax_amount, v_shipping_amount, v_discount_amount, v_total_amount, v_currency, nullif(btrim(coalesce(p_customer_message, '')), ''), now(), p_idempotency_key,
    v_delivery_method
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

  -- Redundant since 20260702_02 moved the ACTIVE→OUT_OF_STOCK flip into
  -- apply_inventory_movement(); kept as a harmless no-op safety net.
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

revoke execute on function public.assert_order_transition(public.order_status, public.order_status) from public, anon, authenticated;
grant execute on function public.assert_order_transition(public.order_status, public.order_status) to service_role;

commit;

-- ============================================================================
-- VERIFY (run manually after applying):
--
-- 1) Column + backfill:
--      select delivery_method, count(*) from public.orders group by 1;
--    Delivery orders placed before this migration must show 'delivery'.
--
-- 2) Transition guard (expect ERROR P0003):
--      select * from public.update_order_admin(<delivered_order_id>, <admin_id>, 'PENDING');
--
-- 3) Payment sync no longer clobbers admin edits:
--      select * from public.update_order_admin(<order_id>, <admin_id>, null, 'PAID');
--      select payment_status from public.orders where order_id = <order_id>;   -- PAID
--      select status from public.payments where order_id = <order_id>;         -- PAID
--
-- 4) New orders carry delivery_method:
--      place a delivery checkout, then
--      select delivery_method from public.orders order by order_id desc limit 1;
-- ============================================================================


-- >>>>>>>>>> migrations/20260702_04_auth_sessions_lockout.sql >>>>>>>>>>
-- ============================================================================
-- 20260702_04_auth_sessions_lockout.sql
-- 1) resolve_session: adds an absolute session lifetime cap of 24 hours
--    (sliding idle timeouts alone let an active session renew forever) and
--    returns created_at so the app fallback can mirror the check.
-- 2) peek_rate_limit / reset_rate_limit: read-only check + counter reset used
--    by the login lockout (fail counters accumulate on bad credentials and
--    clear on success - see src/routes/api/auth/login/+server.ts).
--
-- Deploy order: run this file, then deploy the login/lockout code. The app's
-- built-in fallback (multi-query session lookup, in-memory limits) covers the
-- moment between the DROP below and the CREATE right after it.
-- ============================================================================

begin;

-- Return type gains a column, so the function must be dropped first.
drop function if exists public.resolve_session(text);

create function public.resolve_session(p_token_hash text)
returns table (
  session_id uuid,
  user_id bigint,
  expires_at timestamptz,
  last_activity_at timestamptz,
  created_at timestamptz,
  user_email varchar,
  username varchar,
  full_name text,
  phone varchar,
  user_status public.user_status,
  roles text[]
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    s.session_id,
    u.user_id,
    s.expires_at,
    s.last_activity_at,
    s.created_at,
    u.email as user_email,
    u.username,
    u.full_name,
    u.phone,
    u.status as user_status,
    coalesce(array_agg(r.role_name::text order by r.role_name::text) filter (where r.role_name is not null), '{}'::text[]) as roles
  from public.sessions s
  join public.users u on u.user_id = s.user_id
  left join public.user_roles ur on ur.user_id = u.user_id
  left join public.roles r on r.role_id = ur.role_id
  where s.session_token_hash = p_token_hash
    and s.status = 'ACTIVE'
    and s.expires_at > now()
    and s.created_at > now() - interval '24 hours'
    and u.status = 'ACTIVE'
    and u.deleted_at is null
  group by s.session_id, u.user_id, s.expires_at, s.last_activity_at, s.created_at, u.email, u.username, u.full_name, u.phone, u.status
  limit 1;
$$;

-- Read-only rate-limit check: reports whether the NEXT consume would be
-- allowed, without incrementing anything.
create or replace function public.peek_rate_limit(
  p_key text,
  p_limit integer
)
returns table (
  allowed boolean,
  retry_after_seconds integer
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz := now();
  v_count integer;
  v_reset_at timestamptz;
begin
  if p_key is null or btrim(p_key) = '' then
    raise exception 'Cheia de rate-limit este obligatorie.';
  end if;
  if p_limit < 1 then
    raise exception 'Configurare rate-limit invalidă.';
  end if;

  select rl.request_count, rl.reset_at
  into v_count, v_reset_at
  from public.app_rate_limits rl
  where rl.key = left(p_key, 300);

  if v_count is null or v_reset_at <= v_now then
    allowed := true;
    retry_after_seconds := 0;
  else
    allowed := v_count < p_limit;
    retry_after_seconds := case
      when allowed then 0
      else greatest(1, ceil(extract(epoch from (v_reset_at - v_now)))::integer)
    end;
  end if;

  return next;
end;
$$;

create or replace function public.reset_rate_limit(p_key text)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  delete from public.app_rate_limits
  where key = left(coalesce(p_key, ''), 300);
$$;

revoke execute on function public.resolve_session(text) from public, anon, authenticated;
revoke execute on function public.peek_rate_limit(text, integer) from public, anon, authenticated;
revoke execute on function public.reset_rate_limit(text) from public, anon, authenticated;
grant execute on function public.resolve_session(text) to service_role;
grant execute on function public.peek_rate_limit(text, integer) to service_role;
grant execute on function public.reset_rate_limit(text) to service_role;

commit;

-- ============================================================================
-- VERIFY (run manually after applying):
--
-- 1) Session resolution still works (use a real token hash from sessions):
--      select session_id, created_at from public.resolve_session('<hash>');
--
-- 2) Absolute cap: a session older than 24h resolves to zero rows even if
--    expires_at is in the future:
--      update public.sessions set created_at = now() - interval '25 hours'
--        where session_id = '<test session>';
--      select * from public.resolve_session('<its hash>');  -- expect 0 rows
--
-- 3) Peek does not increment:
--      select * from public.consume_rate_limit('verify:peek', 5, 60);
--      select * from public.peek_rate_limit('verify:peek', 5);  -- allowed=true
--      select request_count from public.app_rate_limits where key = 'verify:peek'; -- still 1
--      select public.reset_rate_limit('verify:peek');
-- ============================================================================


-- >>>>>>>>>> migrations/20260702_05_fk_indexes_product_images.sql >>>>>>>>>>
-- ============================================================================
-- 20260702_05_fk_indexes_product_images.sql
-- 1) Adds the FK indexes that are actually missing (verified against the
--    index list in 20260619_reproducible_schema.sql lines 470-516; most FKs
--    are already covered).
-- 2) Brings the new product_images table (created directly in the dashboard)
--    up to the same standard as the rest of the schema: RLS + policies,
--    grants, updated_at trigger, and a (product_id, sort_order) index for the
--    per-product image lookups the app now does on every catalog read.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1) Missing FK indexes
-- ---------------------------------------------------------------------------

create index if not exists checkouts_billing_address_idx
  on public.checkouts(billing_address_id)
  where billing_address_id is not null;

create index if not exists checkouts_shipping_address_idx
  on public.checkouts(shipping_address_id)
  where shipping_address_id is not null;

create index if not exists support_conversations_order_idx
  on public.support_conversations(order_id)
  where order_id is not null;

create index if not exists support_messages_sender_idx
  on public.support_messages(sender_user_id);

create index if not exists order_status_history_changed_by_idx
  on public.order_status_history(changed_by_user_id);

create index if not exists products_created_by_admin_idx
  on public.products(created_by_admin_id);

create index if not exists products_updated_by_admin_idx
  on public.products(updated_by_admin_id);

-- ---------------------------------------------------------------------------
-- 2) product_images hardening
-- ---------------------------------------------------------------------------

create index if not exists product_images_product_sort_idx
  on public.product_images(product_id, sort_order);

-- updated_at trigger, same as every other table with updated_at.
drop trigger if exists set_updated_at_product_images on public.product_images;
create trigger set_updated_at_product_images
  before update on public.product_images
  for each row execute function public.set_updated_at();

-- RLS: same defense-in-depth model as products - public read for images of
-- publicly visible products, admin full access, app writes via service_role.
alter table public.product_images enable row level security;

revoke all on public.product_images from anon, authenticated;
grant select on public.product_images to anon, authenticated;
grant all on public.product_images to service_role;

drop policy if exists product_images_public_read on public.product_images;
create policy product_images_public_read on public.product_images
  for select to anon, authenticated
  using (
    exists (
      select 1
      from public.products p
      where p.product_id = product_images.product_id
        and p.deleted_at is null
        and p.status in ('ACTIVE', 'OUT_OF_STOCK')
    )
  );

drop policy if exists admins_all_product_images on public.product_images;
create policy admins_all_product_images on public.product_images
  to authenticated
  using (public.current_app_is_admin())
  with check (public.current_app_is_admin());

commit;

-- ============================================================================
-- VERIFY (run manually after applying):
--
-- 1) Indexes exist:
--      select indexname from pg_indexes
--      where schemaname = 'public'
--        and indexname in ('checkouts_billing_address_idx', 'checkouts_shipping_address_idx',
--                          'support_conversations_order_idx', 'support_messages_sender_idx',
--                          'order_status_history_changed_by_idx', 'products_created_by_admin_idx',
--                          'products_updated_by_admin_idx', 'product_images_product_sort_idx');
--    Expect 8 rows.
--
-- 2) product_images has RLS + policies:
--      select rowsecurity from pg_tables where tablename = 'product_images';  -- true
--      select policyname from pg_policies where tablename = 'product_images'; -- 2 rows
--
-- 3) Anon can only see images of visible products (test via the anon key REST
--    endpoint or: set role anon; select count(*) from public.product_images; reset role;)
-- ============================================================================


-- >>>>>>>>>> migrations/20260703_enum_value_drift.sql >>>>>>>>>>
-- ============================================================================
-- 20260703_enum_value_drift.sql
-- Drift fix: the live Supabase database has enum values (added via dashboard)
-- that no migration creates. Found by diffing pg_enum between the live
-- project and a from-scratch rebuild during the self-host migration; without
-- these, a data import fails on auth_logs.event_type and sessions.status.
-- No begin/commit: ALTER TYPE ... ADD VALUE must not run in an explicit
-- transaction where the value could be used later in the same transaction.
-- Idempotent.
-- ============================================================================

alter type public.auth_event_type add value if not exists 'LOGIN_SUCCESS';
alter type public.auth_event_type add value if not exists 'SESSION_EXPIRED';
alter type public.auth_event_type add value if not exists 'SESSION_REVOKED';
alter type public.auth_event_type add value if not exists 'PASSWORD_CHANGED';
alter type public.auth_event_type add value if not exists 'PASSWORD_RESET_REQUESTED';
alter type public.auth_event_type add value if not exists 'ROLE_CHANGED';
alter type public.auth_event_type add value if not exists 'USER_BLOCKED';
alter type public.auth_event_type add value if not exists 'USER_UNBLOCKED';
alter type public.auth_event_type add value if not exists 'ADMIN_SECURITY_ACTION';

alter type public.session_status add value if not exists 'EXPIRED';


-- >>>>>>>>>> migrations/20260703_security_events_review_columns.sql >>>>>>>>>>
-- ============================================================================
-- 20260703_security_events_review_columns.sql
-- Drift fix: the live database's security_events table has severity/triage
-- columns (added via dashboard) that no migration creates. Definitions match
-- the live schema export. Found while importing data during the self-host
-- migration. Idempotent.
-- ============================================================================

begin;

alter table public.security_events
  add column if not exists severity text not null default 'LOW',
  add column if not exists review_status text not null default 'UNREVIEWED',
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by_admin_id bigint,
  add column if not exists admin_note text,
  add column if not exists target_user_id bigint,
  add column if not exists related_ip_hash text;

do $$
begin
  alter table public.security_events
    add constraint security_events_severity_check
    check (severity = any (array['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.security_events
    add constraint security_events_review_status_check
    check (review_status = any (array['UNREVIEWED', 'REVIEWED', 'FALSE_POSITIVE', 'NEEDS_ACTION']));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.security_events
    add constraint security_events_admin_note_check
    check (admin_note is null or char_length(admin_note) <= 240);
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.security_events
    add constraint security_events_related_ip_hash_check
    check (related_ip_hash is null or related_ip_hash ~ '^[a-f0-9]{64}$');
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.security_events
    add constraint security_events_reviewed_by_admin_id_fkey
    foreign key (reviewed_by_admin_id) references public.users(user_id) on delete set null;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.security_events
    add constraint security_events_target_user_id_fkey
    foreign key (target_user_id) references public.users(user_id) on delete set null;
exception when duplicate_object then null;
end $$;

commit;


-- >>>>>>>>>> migrations/20260703_zz_constraint_drift.sql >>>>>>>>>>
-- ============================================================================
-- 20260703_zz_constraint_drift.sql
-- Drift fix: align constraint definitions with the live database (found by
-- diffing pg_get_constraintdef between the live project and a from-scratch
-- rebuild). The live security_events event_type check was widened via
-- dashboard from 3 to 16 values, and several FKs carry ON DELETE actions the
-- migrations lacked. Also renames the product_images image_url check to the
-- live name. Idempotent; the zz prefix keeps it after the other 20260703_*
-- files, since it corrects constraints they create.
-- ============================================================================

begin;

alter table public.security_events
  drop constraint if exists security_events_event_type_check;
alter table public.security_events
  add constraint security_events_event_type_check
  check (event_type = any (array[
    'DECOY_HIT', 'RATE_LIMIT', 'LOGIN_FAILED', 'LOGIN_SUCCESS', 'LOGOUT',
    'SESSION_REVOKED', 'PASSWORD_CHANGED', 'PASSWORD_RESET_REQUESTED',
    'MULTIPLE_ACCOUNTS_SAME_IP', 'MANY_FAILED_LOGINS', 'LOGIN_AFTER_FAILURES',
    'NEW_DEVICE_LOGIN', 'NEW_IP_LOGIN', 'SUSPICIOUS_CHECKOUT_PATTERN',
    'ADMIN_SECURITY_ACTION', 'USER_STATUS_CHANGED'
  ]));

alter table public.product_images
  drop constraint if exists product_images_product_id_fkey;
alter table public.product_images
  add constraint product_images_product_id_fkey
  foreign key (product_id) references public.products(product_id) on delete cascade;

alter table public.product_images
  drop constraint if exists product_images_image_url_check;
alter table public.product_images
  drop constraint if exists product_images_image_url_not_empty;
alter table public.product_images
  add constraint product_images_image_url_not_empty
  check (btrim(image_url) <> '');

alter table public.security_events
  drop constraint if exists security_events_reviewed_by_admin_id_fkey;
alter table public.security_events
  add constraint security_events_reviewed_by_admin_id_fkey
  foreign key (reviewed_by_admin_id) references public.users(user_id) on delete set null;

alter table public.security_events
  drop constraint if exists security_events_target_user_id_fkey;
alter table public.security_events
  add constraint security_events_target_user_id_fkey
  foreign key (target_user_id) references public.users(user_id) on delete set null;

alter table public.user_activity_events
  drop constraint if exists user_activity_events_user_id_fkey;
alter table public.user_activity_events
  add constraint user_activity_events_user_id_fkey
  foreign key (user_id) references public.users(user_id) on delete cascade;

alter table public.user_activity_events
  drop constraint if exists user_activity_events_session_id_fkey;
alter table public.user_activity_events
  add constraint user_activity_events_session_id_fkey
  foreign key (session_id) references public.sessions(session_id) on delete set null;

commit;


-- >>>>>>>>>> migrations/20260710_06_rate_limit_batch.sql >>>>>>>>>>
-- ============================================================================
-- 20260710_06_rate_limit_batch.sql
-- consume_rate_limits: batch version of consume_rate_limit. The request
-- envelope in hooks.server.ts checks up to 3 scopes per request (auth burst /
-- checkout / admin + the general read-write limiter); doing them in one RPC
-- collapses 2-3 sequential round-trips into one.
--
-- Input: jsonb array of {"key": text, "limit": int, "window_seconds": int}.
-- Output: one row per input entry, same order, same semantics as
-- consume_rate_limit (each key is consumed atomically).
--
-- Deploy order: run this file, then deploy the rateLimitMany() hooks code.
-- ============================================================================

begin;

create or replace function public.consume_rate_limits(p_checks jsonb)
returns table (
  key text,
  allowed boolean,
  remaining integer,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz := now();
  raw_check jsonb;
  v_key text;
  v_limit integer;
  v_window_seconds integer;
  v_count integer;
  v_reset_at timestamptz;
begin
  if p_checks is null or jsonb_typeof(p_checks) <> 'array' then
    raise exception 'Configurare rate-limit invalidă.';
  end if;

  if jsonb_array_length(p_checks) > 10 then
    raise exception 'Prea multe verificări de rate-limit într-o cerere.';
  end if;

  for raw_check in select value from jsonb_array_elements(p_checks) as entry(value)
  loop
    v_key := left(coalesce(raw_check ->> 'key', ''), 300);
    v_limit := coalesce((raw_check ->> 'limit')::integer, 0);
    v_window_seconds := coalesce((raw_check ->> 'window_seconds')::integer, 0);

    if btrim(v_key) = '' then
      raise exception 'Cheia de rate-limit este obligatorie.';
    end if;
    if v_limit < 1 or v_window_seconds < 1 then
      raise exception 'Configurare rate-limit invalidă.';
    end if;

    insert into public.app_rate_limits as rl (key, request_count, reset_at, updated_at)
    values (v_key, 1, v_now + make_interval(secs => v_window_seconds), v_now)
    on conflict (key) do update
      set request_count = case
            when rl.reset_at <= v_now then 1
            else rl.request_count + 1
          end,
          reset_at = case
            when rl.reset_at <= v_now then v_now + make_interval(secs => v_window_seconds)
            else rl.reset_at
          end,
          updated_at = v_now
    returning rl.request_count, rl.reset_at into v_count, v_reset_at;

    key := v_key;
    allowed := v_count <= v_limit;
    remaining := greatest(v_limit - v_count, 0);
    retry_after_seconds := case
      when allowed then 0
      else greatest(1, ceil(extract(epoch from (v_reset_at - v_now)))::integer)
    end;

    return next;
  end loop;

  return;
end;
$$;

revoke execute on function public.consume_rate_limits(jsonb) from public, anon, authenticated;
grant execute on function public.consume_rate_limits(jsonb) to service_role;

commit;

-- ============================================================================
-- VERIFY (run manually after applying):
--
--   select * from public.consume_rate_limits(
--     '[{"key":"verify:batch-a","limit":2,"window_seconds":60},
--       {"key":"verify:batch-b","limit":1,"window_seconds":60}]'::jsonb);
--   -- run twice: second run must show batch-b allowed=false, batch-a allowed=true
--   select public.reset_rate_limit('verify:batch-a');
--   select public.reset_rate_limit('verify:batch-b');
-- ============================================================================


-- >>>>>>>>>> migrations/20260710_07_pg_cron_cleanup.sql >>>>>>>>>>
-- ============================================================================
-- 20260710_07_pg_cron_cleanup.sql
-- Automated data cleanup. Before this, nothing pruned sessions,
-- app_rate_limits, checkout_idempotency_keys, security_events, auth_logs or
-- abandoned carts - every table grew forever and the README's cleanup SQL was
-- a manual step nobody runs.
--
-- Prerequisite: enable the pg_cron extension (Dashboard → Database →
-- Extensions → pg_cron) if the CREATE EXTENSION below is refused.
--
-- Each job is a SECURITY DEFINER function returning the number of affected
-- rows, so you can also run any of them manually:
--   select public.run_cleanup_sessions();
--
-- Retention choices:
--   sessions            expire immediately; ended rows deleted after 190 days
--                       (only once no auth_logs row references them)
--   app_rate_limits     1 day past reset
--   checkout_idempotency_keys  7 days (idempotent replay window)
--   security_events     90 days (matches SECURITY_LOG_RETENTION_DAYS default)
--   auth_logs           180 days (append-only trigger amended to allow only
--                       deletes of rows older than the retention)
--   carts               ACTIVE untouched for 60 days → ABANDONED;
--                       OPEN checkouts older than 7 days → EXPIRED
--   support             CLOSED conversations 20 min after closing → ARCHIVED
--                       (moved out of the messages GET request path)
-- ============================================================================

create extension if not exists pg_cron;

begin;

-- Allow the auth_logs cleanup to delete only rows older than the retention;
-- updates and younger deletes still raise (append-only stays intact).
create or replace function public.prevent_auth_log_changes()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'DELETE' and old.event_time < now() - interval '180 days' then
    return old;
  end if;

  raise exception 'Jurnalul de autentificare nu poate fi modificat.';
end;
$$;

create or replace function public.run_cleanup_sessions()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_expired integer;
  v_deleted integer;
begin
  update public.sessions
  set status = 'TIMED_OUT',
      ended_at = now()
  where status = 'ACTIVE'
    and expires_at <= now();
  get diagnostics v_expired = row_count;

  delete from public.sessions s
  where s.status <> 'ACTIVE'
    and s.last_activity_at < now() - interval '190 days'
    and not exists (
      select 1 from public.auth_logs al where al.session_id = s.session_id
    );
  get diagnostics v_deleted = row_count;

  return v_expired + v_deleted;
end;
$$;

create or replace function public.run_cleanup_rate_limits()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer;
begin
  delete from public.app_rate_limits
  where reset_at < now() - interval '1 day';
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.run_cleanup_idempotency_keys()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer;
begin
  delete from public.checkout_idempotency_keys
  where created_at < now() - interval '7 days';
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.run_cleanup_security_events(p_retention_days integer default 90)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer;
begin
  if p_retention_days is null or p_retention_days < 1 or p_retention_days > 365 then
    raise exception 'Retenția security_events trebuie să fie între 1 și 365 de zile.';
  end if;

  delete from public.security_events
  where created_at < now() - make_interval(days => p_retention_days);
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.run_cleanup_auth_logs()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer;
begin
  -- The amended prevent_auth_log_changes trigger permits exactly this delete.
  delete from public.auth_logs
  where event_time < now() - interval '180 days';
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.run_cleanup_carts()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_carts integer;
  v_checkouts integer;
begin
  update public.carts
  set status = 'ABANDONED'
  where status = 'ACTIVE'
    and updated_at < now() - interval '60 days';
  get diagnostics v_carts = row_count;

  update public.checkouts
  set status = 'EXPIRED'
  where status = 'OPEN'
    and created_at < now() - interval '7 days';
  get diagnostics v_checkouts = row_count;

  return v_carts + v_checkouts;
end;
$$;

-- Mirrors archiveEligibleConversations() from src/lib/server/support.ts,
-- which previously ran as a write inside every messages-list GET.
create or replace function public.run_archive_support()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer;
begin
  update public.support_conversations
  set status = 'ARCHIVED',
      updated_at = now()
  where status = 'CLOSED'
    and closed_at is not null
    and closed_at <= now() - interval '20 minutes';
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke execute on function public.run_cleanup_sessions() from public, anon, authenticated;
revoke execute on function public.run_cleanup_rate_limits() from public, anon, authenticated;
revoke execute on function public.run_cleanup_idempotency_keys() from public, anon, authenticated;
revoke execute on function public.run_cleanup_security_events(integer) from public, anon, authenticated;
revoke execute on function public.run_cleanup_auth_logs() from public, anon, authenticated;
revoke execute on function public.run_cleanup_carts() from public, anon, authenticated;
revoke execute on function public.run_archive_support() from public, anon, authenticated;
grant execute on function public.run_cleanup_sessions() to service_role;
grant execute on function public.run_cleanup_rate_limits() to service_role;
grant execute on function public.run_cleanup_idempotency_keys() to service_role;
grant execute on function public.run_cleanup_security_events(integer) to service_role;
grant execute on function public.run_cleanup_auth_logs() to service_role;
grant execute on function public.run_cleanup_carts() to service_role;
grant execute on function public.run_archive_support() to service_role;

commit;

-- Schedules (pg_cron upserts by job name). Staggered so the daily jobs do not
-- pile up at the same second.
select cron.schedule('desaga-cleanup-sessions', '*/30 * * * *', $$select public.run_cleanup_sessions()$$);
select cron.schedule('desaga-archive-support', '*/5 * * * *', $$select public.run_archive_support()$$);
select cron.schedule('desaga-cleanup-rate-limits', '0 3 * * *', $$select public.run_cleanup_rate_limits()$$);
select cron.schedule('desaga-cleanup-idempotency', '10 3 * * *', $$select public.run_cleanup_idempotency_keys()$$);
select cron.schedule('desaga-cleanup-security-events', '20 3 * * *', $$select public.run_cleanup_security_events()$$);
select cron.schedule('desaga-cleanup-auth-logs', '30 3 * * *', $$select public.run_cleanup_auth_logs()$$);
select cron.schedule('desaga-cleanup-carts', '40 3 * * *', $$select public.run_cleanup_carts()$$);

-- ============================================================================
-- VERIFY (run manually after applying):
--
--   select jobname, schedule, active from cron.job order by jobname;
--   -- expect the 7 desaga-* jobs
--
--   select public.run_cleanup_sessions();       -- runs immediately, returns count
--   select public.run_archive_support();
--
--   -- next day:
--   select jobname, status, return_message, start_time
--   from cron.job_run_details
--   order by start_time desc limit 20;
-- ============================================================================


-- >>>>>>>>>> migrations/20260711_08_admin_stats_rpc.sql >>>>>>>>>>
-- ============================================================================
-- 20260711_08_admin_stats_rpc.sql
-- admin_dashboard_stats: one round-trip for the admin dashboard counters.
-- The /api/admin/stats route previously issued 6 count:'exact' queries plus
-- the security counters - each a separate PostgREST round-trip, all of which
-- degrade as orders/messages/security_events grow.
--
-- Deploy order: run this file, then deploy the updated stats route.
-- ============================================================================

begin;

create or replace function public.admin_dashboard_stats()
returns table (
  products bigint,
  orders bigint,
  conversations bigint,
  unread_messages bigint,
  horeca_requests bigint,
  new_horeca_requests bigint,
  security_unread bigint,
  security_decoy_hits_24h bigint,
  security_rate_limits_24h bigint,
  failed_logins_24h bigint
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    (select count(*) from public.products where deleted_at is null),
    (select count(*) from public.orders),
    (select count(*) from public.support_conversations),
    (select count(*) from public.support_messages where sender_type = 'USER' and is_read = false),
    (select count(*) from public.horeca_requests),
    (select count(*) from public.horeca_requests where status = 'NEW'),
    (select count(*) from public.security_events where seen_at is null),
    (select count(*) from public.security_events
      where event_type = 'DECOY_HIT' and created_at >= now() - interval '24 hours'),
    (select count(*) from public.security_events
      where event_type = 'RATE_LIMIT' and created_at >= now() - interval '24 hours'),
    (select count(*) from public.security_events
      where event_type = 'LOGIN_FAILED' and created_at >= now() - interval '24 hours');
$$;

revoke execute on function public.admin_dashboard_stats() from public, anon, authenticated;
grant execute on function public.admin_dashboard_stats() to service_role;

commit;

-- ============================================================================
-- VERIFY (run manually after applying):
--   select * from public.admin_dashboard_stats();
--   -- one row; values match the individual counts, e.g.:
--   select count(*) from public.orders;
-- ============================================================================


-- >>>>>>>>>> migrations/20260711_09_shipping_rules.sql >>>>>>>>>>
-- ============================================================================
-- 20260711_09_shipping_rules.sql
-- Single source of truth for the delivery-fee rule. Until now the rule
-- (free delivery >= 150 RON, otherwise 20 RON) was hardcoded twice: in
-- place_order (what customers are charged) and in src/lib/cart-summary.ts
-- (what the cart displays); drift between them would show one total and
-- charge another.
--
-- 1) app_shipping_rules: one-row config table.
-- 2) place_order recreated to read the rule from the table (falling back to
--    the old constants if the row is missing).
-- 3) The app reads the same row through GET /api/config and feeds it to the
--    cart display, so both sides move together when you change the values.
--
-- Change the rule with:
--   update public.app_shipping_rules
--   set free_delivery_threshold = 200, delivery_fee = 25 where id = 1;
--
-- Deploy order: run this file, then deploy the /api/config + cart code.
-- ============================================================================

begin;

create table if not exists public.app_shipping_rules (
  id smallint primary key default 1 check (id = 1),
  free_delivery_threshold numeric(12, 2) not null default 150 check (free_delivery_threshold >= 0),
  delivery_fee numeric(12, 2) not null default 20 check (delivery_fee >= 0),
  updated_at timestamptz not null default now()
);

insert into public.app_shipping_rules (id)
values (1)
on conflict (id) do nothing;

drop trigger if exists set_updated_at_app_shipping_rules on public.app_shipping_rules;
create trigger set_updated_at_app_shipping_rules
  before update on public.app_shipping_rules
  for each row execute function public.set_updated_at();

alter table public.app_shipping_rules enable row level security;
revoke all on public.app_shipping_rules from anon, authenticated;
grant all on public.app_shipping_rules to service_role;

-- place_order: same as 20260702_03 except the shipping block reads
-- app_shipping_rules instead of hardcoding 150/20.
create or replace function public.place_order(
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
  v_free_threshold numeric(12, 2);
  v_delivery_fee numeric(12, 2);
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

  -- Single source of truth: app_shipping_rules row 1, mirrored to the cart
  -- display through GET /api/config. Falls back to the historical constants
  -- if the row is missing.
  select r.free_delivery_threshold, r.delivery_fee
  into v_free_threshold, v_delivery_fee
  from public.app_shipping_rules r
  where r.id = 1;

  v_free_threshold := coalesce(v_free_threshold, 150);
  v_delivery_fee := coalesce(v_delivery_fee, 20);

  if v_delivery_method = 'delivery' then
    v_shipping_amount := case when v_subtotal >= v_free_threshold then 0 else v_delivery_fee end;
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
    subtotal_amount, tax_amount, shipping_amount, discount_amount, total_amount, currency_code, notes, placed_at, idempotency_key,
    delivery_method
  )
  values (
    v_order_number, p_user_id, v_checkout_id, 'PLACED', 'PENDING', 'UNFULFILLED',
    v_customer_email, v_full_name, v_phone,
    v_full_name, v_billing_line1, v_billing_line2, v_billing_city, v_billing_state_region, v_billing_postal_code, v_country_code,
    v_full_name, v_shipping_line1, v_shipping_line2, v_shipping_city, v_shipping_state_region, v_shipping_postal_code, v_country_code,
    v_subtotal, v_tax_amount, v_shipping_amount, v_discount_amount, v_total_amount, v_currency, nullif(btrim(coalesce(p_customer_message, '')), ''), now(), p_idempotency_key,
    v_delivery_method
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

  -- Redundant since 20260702_02 moved the ACTIVE→OUT_OF_STOCK flip into
  -- apply_inventory_movement(); kept as a harmless no-op safety net.
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

commit;

-- ============================================================================
-- VERIFY (run manually after applying):
--
--   select * from public.app_shipping_rules;   -- one row: 150 / 20
--
--   -- place a 'delivery' checkout with subtotal < threshold; the order's
--   -- shipping_amount must equal delivery_fee:
--   select shipping_amount from public.orders order by order_id desc limit 1;
--
--   -- change the rule and confirm both charge and display move together:
--   update public.app_shipping_rules set delivery_fee = 25 where id = 1;
--   -- GET /api/config now returns 25 and a new delivery order charges 25.
--   update public.app_shipping_rules set delivery_fee = 20 where id = 1;
-- ============================================================================
