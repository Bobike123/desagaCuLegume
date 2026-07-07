begin;

alter table public.newsletter_campaigns
  add column if not exists scheduled_at timestamptz;

create index if not exists newsletter_campaigns_scheduled_send_idx
  on public.newsletter_campaigns (scheduled_at, campaign_id)
  where status = 'SENDING';

drop function if exists public.queue_newsletter_campaign(bigint);

create or replace function public.queue_newsletter_campaign(
  p_campaign_id bigint,
  p_scheduled_at timestamptz default null
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_status varchar(20);
  v_total integer;
begin
  select c.status into v_status
  from public.newsletter_campaigns c
  where c.campaign_id = p_campaign_id
  for update;

  if not found then
    raise exception 'Campania nu există.';
  end if;

  if v_status <> 'DRAFT' then
    raise exception 'Doar campaniile ciornă pot fi puse în coadă.';
  end if;

  insert into public.newsletter_queue(campaign_id, subscriber_id, email)
  select p_campaign_id, s.subscriber_id, s.email
  from public.newsletter_subscribers s
  where s.unsubscribed_at is null
  on conflict (campaign_id, subscriber_id) do nothing;

  select count(*)::integer into v_total
  from public.newsletter_queue q
  where q.campaign_id = p_campaign_id;

  if v_total = 0 then
    raise exception 'Nu există abonați activi.';
  end if;

  update public.newsletter_campaigns
  set status = 'SENDING',
      total_recipients = v_total,
      queued_at = now(),
      scheduled_at = coalesce(p_scheduled_at, now())
  where campaign_id = p_campaign_id;

  return v_total;
end;
$$;

grant execute on function public.queue_newsletter_campaign(bigint, timestamptz) to service_role;

commit;
