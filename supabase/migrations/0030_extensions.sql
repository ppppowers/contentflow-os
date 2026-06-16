-- 0030 — White Label + Plugin/Extension framework (architecture only)
-- Stores per-agency white-label branding and integration connection config. The
-- providers (Mailchimp, Brevo, Constant Contact, WordPress, social) are defined as
-- a code-level extension framework; NO actual integration calls are implemented.

create table public.agency_branding (
  agency_id      uuid primary key references public.agencies(id) on delete cascade,
  brand_name     text,
  logo_url       text,
  primary_color  text,
  custom_domain  text,
  white_label    boolean not null default false,
  updated_at     timestamptz not null default now()
);

create table public.integration_connections (
  id          uuid primary key default gen_random_uuid(),
  agency_id   uuid not null references public.agencies(id) on delete cascade,
  provider_id text not null,                       -- mailchimp | brevo | constant_contact | wordpress | social_publishing
  enabled     boolean not null default false,
  config      jsonb not null default '{}'::jsonb,   -- placeholder; no secrets stored until integrations are built
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (agency_id, provider_id)
);
create index integration_connections_agency_idx on public.integration_connections(agency_id);

create trigger trg_agency_branding_updated before update on public.agency_branding
  for each row execute function public.set_updated_at();
create trigger trg_integration_connections_updated before update on public.integration_connections
  for each row execute function public.set_updated_at();

-- RLS: branding readable by staff, writable by admins. Connections admin-only
-- (they will eventually hold credentials).
alter table public.agency_branding enable row level security;
create policy agency_branding_staff_select on public.agency_branding
  for select using (agency_id = public.current_agency_id() and public.is_agency_staff());
create policy agency_branding_admin_write on public.agency_branding
  for all using (agency_id = public.current_agency_id() and public.is_agency_admin())
  with check (agency_id = public.current_agency_id() and public.is_agency_admin());

alter table public.integration_connections enable row level security;
create policy integration_connections_admin_all on public.integration_connections
  for all using (agency_id = public.current_agency_id() and public.is_agency_admin())
  with check (agency_id = public.current_agency_id() and public.is_agency_admin());
