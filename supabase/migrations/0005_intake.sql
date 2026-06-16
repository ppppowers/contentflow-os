-- 0005 — Monthly intake: submissions, items, files

create table public.intake_submissions (
  id            uuid primary key default gen_random_uuid(),
  agency_id     uuid not null references public.agencies(id) on delete cascade,
  client_id     uuid not null references public.clients(id) on delete cascade,
  period        date not null,  -- first of month
  submitted_by  uuid references public.profiles(id) on delete set null,
  status        text not null default 'open',  -- open | submitted | reviewed
  reviewed_by   uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (client_id, period)
);
create index intake_submissions_client_idx on public.intake_submissions(client_id);

create table public.intake_items (
  id            uuid primary key default gen_random_uuid(),
  agency_id     uuid not null references public.agencies(id) on delete cascade,
  submission_id uuid not null references public.intake_submissions(id) on delete cascade,
  type          intake_type not null,
  title         text,
  body          text,
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);
create index intake_items_submission_idx on public.intake_items(submission_id);

create table public.intake_files (
  id             uuid primary key default gen_random_uuid(),
  agency_id      uuid not null references public.agencies(id) on delete cascade,
  submission_id  uuid not null references public.intake_submissions(id) on delete cascade,
  intake_item_id uuid references public.intake_items(id) on delete set null,
  storage_path   text not null,   -- tenant-scoped path in Supabase Storage
  file_name      text not null,
  mime_type      text,
  size_bytes     bigint,
  created_at     timestamptz not null default now()
);
create index intake_files_submission_idx on public.intake_files(submission_id);

create trigger trg_intake_submissions_updated before update on public.intake_submissions
  for each row execute function public.set_updated_at();
