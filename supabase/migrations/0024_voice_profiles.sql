-- 0024 — Brand Voice Learning V2: rich voice profiles
-- Learns a client's voice from many samples (website, past content, brand sample
-- copy, intake) and stores a structured Brand Voice Profile. Complements
-- brand_profiles (which the pipeline reads); a profile can be APPLIED back to it.

create table public.voice_profiles (
  id          uuid primary key default gen_random_uuid(),
  agency_id   uuid not null references public.agencies(id) on delete cascade,
  client_id   uuid not null references public.clients(id) on delete cascade,
  payload     jsonb not null default '{}'::jsonb,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index voice_profiles_client_idx on public.voice_profiles(client_id, created_at desc);

alter table public.voice_profiles enable row level security;
create policy voice_profiles_staff_all on public.voice_profiles
  for all using (agency_id = public.current_agency_id() and public.is_agency_staff())
  with check (agency_id = public.current_agency_id() and public.is_agency_staff());
