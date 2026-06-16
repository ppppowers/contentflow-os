-- 0027 — Content Gap Analysis Engine
-- Analyzes a client's existing content (projects, strategist angles, channels,
-- services) to surface missing topics, untapped services, and overused content.

create table public.gap_analyses (
  id          uuid primary key default gen_random_uuid(),
  agency_id   uuid not null references public.agencies(id) on delete cascade,
  client_id   uuid not null references public.clients(id) on delete cascade,
  payload     jsonb not null default '{}'::jsonb,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index gap_analyses_client_idx on public.gap_analyses(client_id, created_at desc);

alter table public.gap_analyses enable row level security;
create policy gap_analyses_staff_all on public.gap_analyses
  for all using (agency_id = public.current_agency_id() and public.is_agency_staff())
  with check (agency_id = public.current_agency_id() and public.is_agency_staff());
