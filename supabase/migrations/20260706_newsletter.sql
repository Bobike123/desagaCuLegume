begin;

-- Newsletter: GDPR-consented subscribers, campaigns and a per-recipient send
-- queue. The queue exists because the Brevo free tier caps sending at 300
-- emails/day, so a campaign drains over multiple daily cron runs.

create table public.newsletter_subscribers (
  subscriber_id bigint generated always as identity primary key,
  email varchar(120) not null,
  user_id bigint references public.users(user_id) on delete set null,
  source varchar(20) not null default 'FOOTER',
  consented_at timestamptz not null default now(),
  consent_ip varchar(64),
  unsubscribe_token varchar(64) not null default encode(gen_random_bytes(24), 'hex'),
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint newsletter_subscribers_source_check check (source in ('REGISTER', 'FOOTER', 'ADMIN'))
);

create unique index newsletter_subscribers_email_uidx on public.newsletter_subscribers (lower(email));
create unique index newsletter_subscribers_token_uidx on public.newsletter_subscribers (unsubscribe_token);
create index newsletter_subscribers_active_idx on public.newsletter_subscribers (subscriber_id)
  where unsubscribed_at is null;

create table public.newsletter_campaigns (
  campaign_id bigint generated always as identity primary key,
  subject varchar(200) not null,
  body_html text not null,
  status varchar(20) not null default 'DRAFT',
  total_recipients integer not null default 0,
  sent_count integer not null default 0,
  failed_count integer not null default 0,
  queued_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint newsletter_campaigns_status_check check (status in ('DRAFT', 'SENDING', 'SENT', 'CANCELLED'))
);

create table public.newsletter_queue (
  queue_id bigint generated always as identity primary key,
  campaign_id bigint not null references public.newsletter_campaigns(campaign_id) on delete cascade,
  subscriber_id bigint not null references public.newsletter_subscribers(subscriber_id) on delete cascade,
  -- Email snapshot from queue time; delivery re-checks the live subscriber row
  -- so late unsubscribes are still honored.
  email varchar(120) not null,
  status varchar(20) not null default 'PENDING',
  attempts integer not null default 0,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  constraint newsletter_queue_status_check check (status in ('PENDING', 'SENT', 'FAILED')),
  constraint newsletter_queue_unique unique (campaign_id, subscriber_id)
);

create index newsletter_queue_pending_idx on public.newsletter_queue (campaign_id, queue_id)
  where status = 'PENDING';

create trigger set_updated_at_newsletter_subscribers before update on public.newsletter_subscribers
  for each row execute function public.set_updated_at();
create trigger set_updated_at_newsletter_campaigns before update on public.newsletter_campaigns
  for each row execute function public.set_updated_at();

alter table public.newsletter_subscribers enable row level security;
alter table public.newsletter_campaigns enable row level security;
alter table public.newsletter_queue enable row level security;

create policy admins_all_newsletter_subscribers on public.newsletter_subscribers to authenticated
  using (public.current_app_is_admin()) with check (public.current_app_is_admin());
create policy admins_all_newsletter_campaigns on public.newsletter_campaigns to authenticated
  using (public.current_app_is_admin()) with check (public.current_app_is_admin());
create policy admins_all_newsletter_queue on public.newsletter_queue to authenticated
  using (public.current_app_is_admin()) with check (public.current_app_is_admin());

-- Atomically snapshots the active subscribers into the queue and flips the
-- campaign to SENDING, so recipient count and status can never diverge.
create function public.queue_newsletter_campaign(p_campaign_id bigint)
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
      queued_at = now()
  where campaign_id = p_campaign_id;

  return v_total;
end;
$$;

grant execute on function public.queue_newsletter_campaign(bigint) to service_role;

commit;
