-- 0015 — Agency Knowledge Brain: cross-client winning patterns
-- Business Brain (0014) is per-CLIENT knowledge. The Agency Brain is per-AGENCY:
-- proven elements harvested from ANY client's best work — best subject lines,
-- CTAs, campaign angles, newsletters, prompts — reused to lift ALL future work.
--
-- Provenance (source_client_id/source_project_id) is retained for the dashboard
-- only; entries are injected into generation as anonymized EXEMPLARS, never as
-- verbatim client facts.

create type agency_brain_category as enum (
  'subject_line', 'newsletter', 'campaign', 'prompt', 'cta'
);

create table public.agency_brain_entries (
  id                 uuid primary key default gen_random_uuid(),
  agency_id          uuid not null references public.agencies(id) on delete cascade,
  category           agency_brain_category not null,
  content            text not null,
  source_client_id   uuid references public.clients(id) on delete set null,
  source_project_id  uuid references public.content_projects(id) on delete set null,
  authenticity_score int check (authenticity_score between 0 and 100),  -- signal at harvest
  times_used         int not null default 0,
  tags               text[] not null default '{}',
  is_active          boolean not null default true,
  created_by         uuid references public.profiles(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index agency_brain_cat_idx on public.agency_brain_entries(agency_id, category) where is_active;
-- One harvested element per (project, category, content) — guards re-harvest dupes.
create unique index agency_brain_dedup_idx
  on public.agency_brain_entries(source_project_id, category, md5(content))
  where source_project_id is not null;

create trigger trg_agency_brain_updated before update on public.agency_brain_entries
  for each row execute function public.set_updated_at();

-- RLS: staff-only, tenant-scoped. Cross-client WITHIN an agency; clients never see it.
alter table public.agency_brain_entries enable row level security;
create policy agency_brain_staff_all on public.agency_brain_entries
  for all using (agency_id = public.current_agency_id() and public.is_agency_staff())
  with check (agency_id = public.current_agency_id() and public.is_agency_staff());
