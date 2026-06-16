-- 0028 — Red Team + multi-layer QA
-- qa_reviews stores one row per QA layer. A standalone Red Team review is its own
-- run (one row); a full QA run shares a run_id across all layers (strategy,
-- writing, humanization, brand_voice, compliance, red_team, final).

create table public.qa_reviews (
  id          uuid primary key default gen_random_uuid(),
  agency_id   uuid not null references public.agencies(id) on delete cascade,
  project_id  uuid not null references public.content_projects(id) on delete cascade,
  run_id      uuid not null,
  layer       text not null,                 -- strategy|writing|humanization|brand_voice|compliance|red_team|final
  score       int check (score between 0 and 100),
  passed      boolean not null default false,
  findings    jsonb not null default '[]'::jsonb,
  summary     text not null default '',
  created_at  timestamptz not null default now()
);
create index qa_reviews_project_idx on public.qa_reviews(project_id, created_at desc);
create index qa_reviews_run_idx on public.qa_reviews(run_id);

alter table public.qa_reviews enable row level security;
create policy qa_reviews_staff_all on public.qa_reviews
  for all using (agency_id = public.current_agency_id() and public.is_agency_staff())
  with check (agency_id = public.current_agency_id() and public.is_agency_staff());
