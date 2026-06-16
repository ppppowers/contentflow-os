-- 0022 — Content Strategy Engine: 30/60/90-day content roadmaps
-- The Strategic Planning Department synthesizes the Business Brain, Story Bank,
-- website analysis, recent topics, and agency patterns into a dated roadmap of
-- recommended newsletters / blogs / campaigns / promotions per client.

create table public.content_roadmaps (
  id          uuid primary key default gen_random_uuid(),
  agency_id   uuid not null references public.agencies(id) on delete cascade,
  client_id   uuid not null references public.clients(id) on delete cascade,
  horizon     int not null check (horizon in (30, 60, 90)),
  payload     jsonb not null default '{}'::jsonb,   -- full structured roadmap
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index content_roadmaps_client_idx on public.content_roadmaps(client_id, horizon, created_at desc);

alter table public.content_roadmaps enable row level security;
create policy content_roadmaps_staff_all on public.content_roadmaps
  for all using (agency_id = public.current_agency_id() and public.is_agency_staff())
  with check (agency_id = public.current_agency_id() and public.is_agency_staff());
