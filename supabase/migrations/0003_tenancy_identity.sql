-- 0003 — Tenancy + identity: agencies, profiles, client_user_links

create table public.agencies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  plan        text not null default 'internal',
  settings    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 1:1 with auth.users. Carries tenant + role.
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  agency_id   uuid not null references public.agencies(id) on delete cascade,
  role        user_role not null default 'writer',
  full_name   text,
  email       citext not null,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index profiles_agency_idx on public.profiles(agency_id);

-- Maps a client-role login to the client account(s) it can view.
create table public.client_user_links (
  id          uuid primary key default gen_random_uuid(),
  agency_id   uuid not null references public.agencies(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  client_id   uuid not null,  -- FK added in 0004 after clients exists
  created_at  timestamptz not null default now(),
  unique (profile_id, client_id)
);
create index client_user_links_agency_idx on public.client_user_links(agency_id);
create index client_user_links_client_idx on public.client_user_links(client_id);

create trigger trg_agencies_updated before update on public.agencies
  for each row execute function public.set_updated_at();
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();
