-- 0025 — Revision Intelligence Engine: learned client preference profiles
-- Analyzes a client's revision history, approval comments, and turnaround to build
-- a Client Preference Profile that is fed back into future content generation.

create table public.preference_profiles (
  id                  uuid primary key default gen_random_uuid(),
  agency_id           uuid not null references public.agencies(id) on delete cascade,
  client_id           uuid not null references public.clients(id) on delete cascade,
  approval_speed_days numeric(6,2),
  payload             jsonb not null default '{}'::jsonb,
  created_by          uuid references public.profiles(id) on delete set null,
  created_at          timestamptz not null default now()
);
create index preference_profiles_client_idx on public.preference_profiles(client_id, created_at desc);

alter table public.preference_profiles enable row level security;
create policy preference_profiles_staff_all on public.preference_profiles
  for all using (agency_id = public.current_agency_id() and public.is_agency_staff())
  with check (agency_id = public.current_agency_id() and public.is_agency_staff());
