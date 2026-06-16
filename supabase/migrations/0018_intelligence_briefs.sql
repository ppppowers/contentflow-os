-- 0018 — Client Interview Agent: Monthly Intelligence Briefs
-- The Interview Agent runs on a monthly intake submission (BEFORE a content
-- project exists) to interrogate thin input: it extracts stories/promos/events/
-- wins/achievements, flags gaps, and generates dynamic follow-up questions.
-- Stored per submission; the latest row is the active brief.

create table public.intelligence_briefs (
  id              uuid primary key default gen_random_uuid(),
  agency_id       uuid not null references public.agencies(id) on delete cascade,
  client_id       uuid not null references public.clients(id) on delete cascade,
  submission_id   uuid not null references public.intake_submissions(id) on delete cascade,
  period          date,
  summary         text not null default '',
  readiness_score int check (readiness_score between 0 and 100),
  payload         jsonb not null default '{}'::jsonb,  -- full structured brief
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now()
);
create index intelligence_briefs_submission_idx on public.intelligence_briefs(submission_id, created_at desc);

alter table public.intelligence_briefs enable row level security;
create policy intelligence_briefs_staff_all on public.intelligence_briefs
  for all using (agency_id = public.current_agency_id() and public.is_agency_staff())
  with check (agency_id = public.current_agency_id() and public.is_agency_staff());
