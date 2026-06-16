-- 0019 — Website Intelligence Engine: stored site analyses
-- Fetches a client's public website, analyzes it with Claude, and stores the
-- extracted brand voice / audience / services / keywords / USPs plus generated
-- newsletter / blog / campaign ideas. Latest row per client = active analysis.

create table public.website_analyses (
  id          uuid primary key default gen_random_uuid(),
  agency_id   uuid not null references public.agencies(id) on delete cascade,
  client_id   uuid not null references public.clients(id) on delete cascade,
  url         text not null,
  pages       text[] not null default '{}',          -- urls actually fetched
  payload     jsonb not null default '{}'::jsonb,      -- full structured analysis
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index website_analyses_client_idx on public.website_analyses(client_id, created_at desc);

alter table public.website_analyses enable row level security;
create policy website_analyses_staff_all on public.website_analyses
  for all using (agency_id = public.current_agency_id() and public.is_agency_staff())
  with check (agency_id = public.current_agency_id() and public.is_agency_staff());
