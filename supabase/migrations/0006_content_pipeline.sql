-- 0006 — Content pipeline: projects, agent_runs, agent_outputs, content_pieces, authenticity_scores

create table public.content_projects (
  id                 uuid primary key default gen_random_uuid(),
  agency_id          uuid not null references public.agencies(id) on delete cascade,
  client_id          uuid not null references public.clients(id) on delete cascade,
  submission_id      uuid references public.intake_submissions(id) on delete set null,
  period             date,
  title              text not null,
  status             project_status not null default 'intake_received',
  current_agent      agent_name,
  authenticity_score int check (authenticity_score between 0 and 100),
  created_by         uuid references public.profiles(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index content_projects_agency_status_idx on public.content_projects(agency_id, status);
create index content_projects_client_idx on public.content_projects(client_id);

-- Append-only audit: one row per agent invocation.
create table public.agent_runs (
  id            uuid primary key default gen_random_uuid(),
  agency_id     uuid not null references public.agencies(id) on delete cascade,
  project_id    uuid not null references public.content_projects(id) on delete cascade,
  agent         agent_name not null,
  status        run_status not null default 'queued',
  input_ref     jsonb not null default '{}'::jsonb,
  model         text,
  input_tokens  int,
  output_tokens int,
  cost_usd      numeric(10,4),
  error         text,
  started_at    timestamptz,
  finished_at   timestamptz,
  created_at    timestamptz not null default now()
);
create index agent_runs_project_idx on public.agent_runs(project_id, started_at);

-- Versioned structured handoff payloads. Downstream agents read only these.
create table public.agent_outputs (
  id            uuid primary key default gen_random_uuid(),
  agency_id     uuid not null references public.agencies(id) on delete cascade,
  project_id    uuid not null references public.content_projects(id) on delete cascade,
  run_id        uuid references public.agent_runs(id) on delete set null,
  agent         agent_name not null,
  payload       jsonb not null,
  version       int not null default 1,
  supersedes_id uuid references public.agent_outputs(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index agent_outputs_project_agent_idx on public.agent_outputs(project_id, agent);

create table public.content_pieces (
  id          uuid primary key default gen_random_uuid(),
  agency_id   uuid not null references public.agencies(id) on delete cascade,
  project_id  uuid not null references public.content_projects(id) on delete cascade,
  channel     content_channel not null,
  title       text,
  body        text,
  metadata    jsonb not null default '{}'::jsonb,  -- subject_lines[], preview_text, seo_title, meta_description, slug, keywords[]
  version     int not null default 1,
  status      text not null default 'draft',
  created_at  timestamptz not null default now()
);
create index content_pieces_project_idx on public.content_pieces(project_id);

create table public.authenticity_scores (
  id              uuid primary key default gen_random_uuid(),
  agency_id       uuid not null references public.agencies(id) on delete cascade,
  project_id      uuid not null references public.content_projects(id) on delete cascade,
  piece_id        uuid references public.content_pieces(id) on delete cascade,
  run_id          uuid references public.agent_runs(id) on delete set null,
  score           int not null check (score between 0 and 100),
  flagged_phrases jsonb not null default '[]'::jsonb,
  breakdown       jsonb not null default '{}'::jsonb,
  passed          boolean not null default false,  -- score >= 90
  created_at      timestamptz not null default now()
);
create index authenticity_scores_project_idx on public.authenticity_scores(project_id);

create trigger trg_content_projects_updated before update on public.content_projects
  for each row execute function public.set_updated_at();
