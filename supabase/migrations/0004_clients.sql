-- 0004 — Client domain: clients, contacts, brand_profiles, notes, packages, monthly_plans

create table public.clients (
  id            uuid primary key default gen_random_uuid(),
  agency_id     uuid not null references public.agencies(id) on delete cascade,
  name          text not null,
  website_url   text,
  industry      text,
  status        client_status not null default 'active',
  health_score  int not null default 100 check (health_score between 0 and 100),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index clients_agency_idx on public.clients(agency_id);

-- Deferred FK from 0003 now that clients exists.
alter table public.client_user_links
  add constraint client_user_links_client_fk
  foreign key (client_id) references public.clients(id) on delete cascade;

create table public.client_contacts (
  id          uuid primary key default gen_random_uuid(),
  agency_id   uuid not null references public.agencies(id) on delete cascade,
  client_id   uuid not null references public.clients(id) on delete cascade,
  name        text not null,
  email       citext,
  phone       text,
  title       text,
  is_primary  boolean not null default false,
  created_at  timestamptz not null default now()
);
create index client_contacts_client_idx on public.client_contacts(client_id);

-- Voice spec agents must honor. One active version per client.
create table public.brand_profiles (
  id                  uuid primary key default gen_random_uuid(),
  agency_id           uuid not null references public.agencies(id) on delete cascade,
  client_id           uuid not null references public.clients(id) on delete cascade,
  voice_summary       text,
  tone_descriptors    text[] not null default '{}',
  audience            text,
  products_services   jsonb not null default '[]'::jsonb,
  sample_copy         text,
  banned_phrases      text[] not null default '{}',
  required_disclaimers text[] not null default '{}',
  reading_level       text,
  version             int not null default 1,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now()
);
create index brand_profiles_client_idx on public.brand_profiles(client_id);
create unique index brand_profiles_one_active
  on public.brand_profiles(client_id) where is_active;

create table public.client_notes (
  id          uuid primary key default gen_random_uuid(),
  agency_id   uuid not null references public.agencies(id) on delete cascade,
  client_id   uuid not null references public.clients(id) on delete cascade,
  author_id   uuid references public.profiles(id) on delete set null,
  body        text not null,
  pinned      boolean not null default false,
  created_at  timestamptz not null default now()
);
create index client_notes_client_idx on public.client_notes(client_id);

create table public.packages (
  id             uuid primary key default gen_random_uuid(),
  agency_id      uuid not null references public.agencies(id) on delete cascade,
  name           text not null,
  monthly_price  numeric(10,2) not null default 0,
  deliverables   jsonb not null default '[]'::jsonb,
  created_at     timestamptz not null default now()
);
create index packages_agency_idx on public.packages(agency_id);

create table public.monthly_plans (
  id            uuid primary key default gen_random_uuid(),
  agency_id     uuid not null references public.agencies(id) on delete cascade,
  client_id     uuid not null references public.clients(id) on delete cascade,
  period        date not null,  -- first of month
  package_id    uuid references public.packages(id) on delete set null,
  deliverables  jsonb not null default '[]'::jsonb,
  status        text not null default 'planned',
  created_at    timestamptz not null default now(),
  unique (client_id, period)
);
create index monthly_plans_client_idx on public.monthly_plans(client_id);

create trigger trg_clients_updated before update on public.clients
  for each row execute function public.set_updated_at();
