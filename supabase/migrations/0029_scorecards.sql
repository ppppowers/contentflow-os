-- 0029 — Output Quality Scorecard
-- Scores a project's deliverables across 8 dimensions → overall score. Target 95+;
-- anything lower flags for revision. Deterministic dims (authenticity, specificity,
-- readability) come from real data; the rest are LLM-judged.

create table public.scorecards (
  id          uuid primary key default gen_random_uuid(),
  agency_id   uuid not null references public.agencies(id) on delete cascade,
  project_id  uuid not null references public.content_projects(id) on delete cascade,
  scores      jsonb not null default '{}'::jsonb,   -- {businessValue, humanAuthenticity, ...}
  overall     int not null check (overall between 0 and 100),
  passed      boolean not null default false,        -- overall >= 95
  summary     text not null default '',
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index scorecards_project_idx on public.scorecards(project_id, created_at desc);

alter table public.scorecards enable row level security;
create policy scorecards_staff_all on public.scorecards
  for all using (agency_id = public.current_agency_id() and public.is_agency_staff())
  with check (agency_id = public.current_agency_id() and public.is_agency_staff());
