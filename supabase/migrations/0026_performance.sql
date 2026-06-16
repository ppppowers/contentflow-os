-- 0026 — Performance Learning Engine
-- Tracks per-send performance metrics (opens/clicks/replies/conversions/unsubs)
-- and generates Performance Insights Reports. No email integration exists yet
-- (Phase 22 is an extension framework only), so metrics are entered manually or
-- imported; the analysis + insights are the engine.

create table public.performance_metrics (
  id            uuid primary key default gen_random_uuid(),
  agency_id     uuid not null references public.agencies(id) on delete cascade,
  client_id     uuid not null references public.clients(id) on delete cascade,
  project_id    uuid references public.content_projects(id) on delete set null,
  channel       text not null default 'newsletter',
  subject_line  text,
  sent          int not null default 0 check (sent >= 0),
  opens         int not null default 0 check (opens >= 0),
  clicks        int not null default 0 check (clicks >= 0),
  replies       int not null default 0 check (replies >= 0),
  conversions   int not null default 0 check (conversions >= 0),
  unsubscribes  int not null default 0 check (unsubscribes >= 0),
  recorded_at   date not null default (now()::date),
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index performance_metrics_client_idx on public.performance_metrics(client_id, recorded_at desc);

create table public.performance_reports (
  id          uuid primary key default gen_random_uuid(),
  agency_id   uuid not null references public.agencies(id) on delete cascade,
  client_id   uuid not null references public.clients(id) on delete cascade,
  payload     jsonb not null default '{}'::jsonb,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index performance_reports_client_idx on public.performance_reports(client_id, created_at desc);

alter table public.performance_metrics enable row level security;
alter table public.performance_reports enable row level security;
create policy performance_metrics_staff_all on public.performance_metrics
  for all using (agency_id = public.current_agency_id() and public.is_agency_staff())
  with check (agency_id = public.current_agency_id() and public.is_agency_staff());
create policy performance_reports_staff_all on public.performance_reports
  for all using (agency_id = public.current_agency_id() and public.is_agency_staff())
  with check (agency_id = public.current_agency_id() and public.is_agency_staff());
