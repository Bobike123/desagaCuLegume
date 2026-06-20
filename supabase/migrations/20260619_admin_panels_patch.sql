begin;

create sequence if not exists public.order_number_seq
  as bigint
  start with 1
  increment by 1
  no minvalue
  no maxvalue
  cache 1;

lock table public.orders in exclusive mode;

update public.orders
set order_number = 'legacy-' || order_id::text;

with numbered as (
  select
    order_id,
    row_number() over (order by coalesce(placed_at, created_at), order_id)::text as next_order_number
  from public.orders
)
update public.orders o
set order_number = numbered.next_order_number
from numbered
where numbered.order_id = o.order_id;

update public.support_conversations sc
set subject = 'Comandă #' || o.order_number
from public.orders o
where sc.order_id = o.order_id
  and sc.topic = 'ORDER';

select setval(
  'public.order_number_seq',
  coalesce((select max(order_number::bigint) from public.orders where order_number ~ '^\d+$'), 0) + 1,
  false
);

create or replace function public.generate_order_number()
returns varchar(40)
language sql
volatile
set search_path = public, pg_temp
as $$
  select nextval('public.order_number_seq')::text::varchar(40);
$$;

alter table public.support_conversations
  add column if not exists closed_at timestamptz;

drop function if exists public.support_conversation_summaries(bigint, boolean, text, text, text, integer, integer);

create function public.support_conversation_summaries(
  p_viewer_user_id bigint,
  p_is_admin boolean,
  p_status text default null,
  p_topic text default null,
  p_search text default null,
  p_limit integer default 30,
  p_offset integer default 0
)
returns table (
  conversation_id bigint,
  user_id bigint,
  subject varchar,
  status public.conversation_status,
  created_at timestamptz,
  updated_at timestamptz,
  closed_at timestamptz,
  order_id bigint,
  topic varchar,
  user_email varchar,
  username varchar,
  full_name text,
  phone varchar,
  order_number varchar,
  total_amount numeric,
  currency_code varchar,
  order_status public.order_status,
  payment_status public.payment_status,
  fulfillment_status public.fulfillment_status,
  order_created_at timestamptz,
  placed_at timestamptz,
  last_message_id bigint,
  last_message_body text,
  last_message_sender_type public.message_sender_type,
  last_message_created_at timestamptz,
  unread_count bigint,
  total_count bigint
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with filtered as (
    select
      sc.conversation_id,
      sc.user_id,
      sc.subject,
      sc.status,
      sc.created_at,
      sc.updated_at,
      sc.closed_at,
      sc.order_id,
      sc.topic,
      u.email as user_email,
      u.username,
      u.full_name,
      u.phone,
      o.order_number,
      o.total_amount,
      o.currency_code,
      o.status as order_status,
      o.payment_status,
      o.fulfillment_status,
      o.created_at as order_created_at,
      o.placed_at,
      lm.message_id as last_message_id,
      lm.message_body as last_message_body,
      lm.sender_type as last_message_sender_type,
      lm.created_at as last_message_created_at,
      (
        select count(*)
        from public.support_messages sm
        where sm.conversation_id = sc.conversation_id
          and sm.is_read = false
          and sm.sender_type = case when p_is_admin then 'USER'::public.message_sender_type else 'ADMIN'::public.message_sender_type end
      ) as unread_count
    from public.support_conversations sc
    join public.users u on u.user_id = sc.user_id
    left join public.orders o on o.order_id = sc.order_id
    left join lateral (
      select sm.message_id, sm.message_body, sm.sender_type, sm.created_at
      from public.support_messages sm
      where sm.conversation_id = sc.conversation_id
      order by sm.created_at desc, sm.message_id desc
      limit 1
    ) lm on true
    where (p_is_admin or sc.user_id = p_viewer_user_id)
      and (p_status is null or sc.status::text = upper(p_status))
      and (p_topic is null or sc.topic = upper(p_topic))
      and (
        nullif(btrim(coalesce(p_search, '')), '') is null
        or (
          sc.subject ilike '%' || p_search || '%'
          or u.email ilike '%' || p_search || '%'
          or u.username ilike '%' || p_search || '%'
          or coalesce(u.full_name, '') ilike '%' || p_search || '%'
          or coalesce(u.phone, '') ilike '%' || p_search || '%'
          or coalesce(o.order_number, '') ilike '%' || p_search || '%'
          or coalesce(lm.message_body, '') ilike '%' || p_search || '%'
        )
      )
  )
  select
    filtered.*,
    count(*) over() as total_count
  from filtered
  order by filtered.updated_at desc, filtered.conversation_id desc
  limit greatest(1, least(coalesce(p_limit, 30), 100))
  offset greatest(0, coalesce(p_offset, 0));
$$;

grant execute on function public.support_conversation_summaries(bigint, boolean, text, text, text, integer, integer) to service_role;
grant usage, select on sequence public.order_number_seq to service_role;

commit;
