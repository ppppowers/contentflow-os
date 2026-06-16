-- 0021 — Story Mining Engine: searchable Story Bank
-- The Story Mining Agent reads a client's intake, meeting reports, and Business
-- Brain, and surfaces distinct, reusable STORIES — customer / volunteer / donor /
-- employee / project-success — each tagged, categorized, and full-text searchable.

create type story_category as enum ('customer', 'volunteer', 'donor', 'employee', 'project_success');

create table public.stories (
  id          uuid primary key default gen_random_uuid(),
  agency_id   uuid not null references public.agencies(id) on delete cascade,
  client_id   uuid not null references public.clients(id) on delete cascade,
  category    story_category not null,
  title       text not null,
  summary     text not null default '',
  detail      text not null default '',
  tags        text[] not null default '{}',
  status      text not null default 'lead',     -- lead | ready | used
  source      text not null default 'mined',     -- mined | manual
  source_refs jsonb not null default '{}'::jsonb, -- where it was mined from
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  search      tsvector generated always as (
    public.search_vector(title, summary, detail, tags)
  ) stored
);
create index stories_client_cat_idx on public.stories(client_id, category);
create index stories_search_idx on public.stories using gin(search);
create index stories_tags_idx on public.stories using gin(tags);

create trigger trg_stories_updated before update on public.stories
  for each row execute function public.set_updated_at();

alter table public.stories enable row level security;
create policy stories_staff_all on public.stories
  for all using (agency_id = public.current_agency_id() and public.is_agency_staff())
  with check (agency_id = public.current_agency_id() and public.is_agency_staff());
