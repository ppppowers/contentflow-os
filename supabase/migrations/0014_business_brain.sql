-- 0014 — Business Brain: permanent, structured client knowledge
-- Complements brand_profiles (which owns VOICE: tone, audience, banned phrases,
-- products_services list). The Brain owns durable FACTS the agency accumulates
-- about a client — history, services, products, promotions, events, CTA prefs —
-- that every content run must consult before writing.
--
-- One flexible typed table (not many) so later phases extend categories without
-- new migrations. `data` holds category-specific structure (e.g. promo dates).

create type brain_category as enum (
  'company_history', 'service', 'product', 'promotion',
  'event', 'cta_preference', 'audience_insight', 'key_fact'
);

create table public.brain_entries (
  id          uuid primary key default gen_random_uuid(),
  agency_id   uuid not null references public.agencies(id) on delete cascade,
  client_id   uuid not null references public.clients(id) on delete cascade,
  category    brain_category not null,
  title       text not null,
  body        text not null default '',
  data        jsonb not null default '{}'::jsonb,   -- e.g. {starts_on, ends_on, url}
  priority    int not null default 0,                -- higher = surfaced first in context
  source      text not null default 'manual',        -- manual | website | intake | voice_note
  is_active   boolean not null default true,         -- inactive = excluded from generation context
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index brain_entries_client_cat_idx on public.brain_entries(client_id, category) where is_active;
create index brain_entries_agency_idx on public.brain_entries(agency_id);

create trigger trg_brain_entries_updated before update on public.brain_entries
  for each row execute function public.set_updated_at();

-- RLS: staff-only, tenant-scoped (same shape as clients/brand_profiles).
alter table public.brain_entries enable row level security;
create policy brain_entries_staff_all on public.brain_entries
  for all using (agency_id = public.current_agency_id() and public.is_agency_staff())
  with check (agency_id = public.current_agency_id() and public.is_agency_staff());
