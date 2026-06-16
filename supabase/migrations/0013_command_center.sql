-- 0013 — Command Center: task management for orchestrated work
-- The Command Center is the single entry point for agent/workflow execution.
-- Execution telemetry already lives in agent_runs (per-agent) and audit_log
-- (sensitive events). cc_tasks adds the missing layer: a durable, queryable
-- record of every dispatch — what was requested, by whom, and how it resolved.

-- Lifecycle of a dispatched unit of work. Mirrors run_status + 'cancelled'.
create type cc_task_status as enum ('queued', 'running', 'succeeded', 'failed', 'cancelled');

-- 'workflow' = ordered multi-agent run; 'agent' = single-agent (re)run.
create type cc_task_kind as enum ('workflow', 'agent');

create table public.cc_tasks (
  id            uuid primary key default gen_random_uuid(),
  agency_id     uuid not null references public.agencies(id) on delete cascade,
  project_id    uuid references public.content_projects(id) on delete cascade,
  kind          cc_task_kind not null,
  target        text not null,                        -- workflow name or agent_name
  status        cc_task_status not null default 'queued',
  priority      int not null default 0,               -- higher runs first when queued
  requested_by  uuid references public.profiles(id) on delete set null,
  payload       jsonb not null default '{}'::jsonb,   -- dispatch input (e.g. {upTo})
  result        jsonb not null default '{}'::jsonb,    -- PipelineResult / RunResult summary
  error         text,
  started_at    timestamptz,
  finished_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index cc_tasks_agency_status_idx on public.cc_tasks(agency_id, status, priority desc);
create index cc_tasks_project_idx on public.cc_tasks(project_id, created_at);

create trigger trg_cc_tasks_updated before update on public.cc_tasks
  for each row execute function public.set_updated_at();

-- RLS: staff-only, tenant-scoped (same shape as agent_runs).
alter table public.cc_tasks enable row level security;
create policy cc_tasks_staff_all on public.cc_tasks
  for all using (agency_id = public.current_agency_id() and public.is_agency_staff())
  with check (agency_id = public.current_agency_id() and public.is_agency_staff());
