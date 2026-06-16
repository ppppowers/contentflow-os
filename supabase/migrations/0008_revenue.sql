-- 0008 — Revenue: subscriptions, revenue_events, + MRR view

create table public.subscriptions (
  id                   uuid primary key default gen_random_uuid(),
  agency_id            uuid not null references public.agencies(id) on delete cascade,
  client_id            uuid not null references public.clients(id) on delete cascade,
  package_id           uuid references public.packages(id) on delete set null,
  monthly_amount       numeric(10,2) not null default 0,
  status               subscription_status not null default 'active',
  started_at           timestamptz not null default now(),
  current_period_start date,
  current_period_end   date,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index subscriptions_client_idx on public.subscriptions(client_id);
create index subscriptions_agency_status_idx on public.subscriptions(agency_id, status);

-- Append-only ledger for MRR / LTV.
create table public.revenue_events (
  id              uuid primary key default gen_random_uuid(),
  agency_id       uuid not null references public.agencies(id) on delete cascade,
  client_id       uuid not null references public.clients(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  type            revenue_event_type not null,  -- charge | refund | adjustment
  amount          numeric(10,2) not null,
  occurred_at     timestamptz not null default now(),
  payment_status  payment_status not null default 'pending',
  created_at      timestamptz not null default now()
);
create index revenue_events_agency_time_idx on public.revenue_events(agency_id, occurred_at);

-- Active MRR per agency = sum of active subscription monthly_amount.
create view public.v_agency_mrr as
  select agency_id, coalesce(sum(monthly_amount), 0) as mrr
  from public.subscriptions
  where status = 'active'
  group by agency_id;

-- Client lifetime value = sum of paid charges minus refunds.
create view public.v_client_ltv as
  select agency_id, client_id,
    coalesce(sum(case when type = 'refund' then -amount else amount end), 0) as ltv
  from public.revenue_events
  where payment_status = 'paid'
  group by agency_id, client_id;

create trigger trg_subscriptions_updated before update on public.subscriptions
  for each row execute function public.set_updated_at();
