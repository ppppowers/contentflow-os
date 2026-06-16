-- 0007 — Approval workflow: approvals, revisions

create table public.approvals (
  id          uuid primary key default gen_random_uuid(),
  agency_id   uuid not null references public.agencies(id) on delete cascade,
  project_id  uuid not null references public.content_projects(id) on delete cascade,
  stage       approval_stage not null,        -- internal | client
  decision    approval_decision not null default 'pending',
  decided_by  uuid references public.profiles(id) on delete set null,
  comment     text,
  created_at  timestamptz not null default now()
);
create index approvals_project_idx on public.approvals(project_id);

create table public.revisions (
  id            uuid primary key default gen_random_uuid(),
  agency_id     uuid not null references public.agencies(id) on delete cascade,
  project_id    uuid not null references public.content_projects(id) on delete cascade,
  approval_id   uuid references public.approvals(id) on delete set null,
  requested_by  uuid references public.profiles(id) on delete set null,
  scope         text,
  instructions  text not null,
  status        text not null default 'open',  -- open | addressed
  created_at    timestamptz not null default now()
);
create index revisions_project_idx on public.revisions(project_id);
