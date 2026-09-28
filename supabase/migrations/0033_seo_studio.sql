-- 0033 — SEO Studio: research → outline → write → optimize → publish → monitor,
-- plus AI-answer visibility tracking. All tables agency-scoped, staff-only RLS.
-- Written to be safe to re-run.

-- Where a client's articles get published (a Next.js site in a GitHub repo).
create table if not exists public.site_connections (
  id            uuid primary key default gen_random_uuid(),
  agency_id     uuid not null references public.agencies(id) on delete cascade,
  client_id     uuid not null unique references public.clients(id) on delete cascade,
  site_url      text not null,                 -- https://volunteerflow.us
  repo          text,                          -- owner/name
  branch        text not null default 'main',  -- base branch for pull requests
  content_dir   text,                          -- folder for article JSON files
  url_prefix    text not null default '/resources',
  sitemap_path  text,                          -- optional static sitemap.xml to append to
  brand_terms   text[] not null default '{}',  -- names/domains that count as a mention
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.seo_articles (
  id               uuid primary key default gen_random_uuid(),
  agency_id        uuid not null references public.agencies(id) on delete cascade,
  client_id        uuid not null references public.clients(id) on delete cascade,
  keyword          text not null,
  status           text not null default 'new',  -- new | researched | drafted | published
  research         jsonb,                        -- competitors, questions, gaps, terms, outline
  outline          jsonb,                        -- editable [{ heading, level, notes }]
  title            text,
  slug             text,
  meta_description text,
  body_md          text,
  faq              jsonb not null default '[]'::jsonb,  -- [{ question, answer }]
  score            int,
  score_details    jsonb,
  published_url    text,
  pr_url           text,
  published_at     timestamptz,
  created_by       uuid references public.profiles(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists seo_articles_client_idx on public.seo_articles(client_id);

-- Questions people ask AI assistants, checked for brand mentions.
create table if not exists public.ai_prompts (
  id          uuid primary key default gen_random_uuid(),
  agency_id   uuid not null references public.agencies(id) on delete cascade,
  client_id   uuid not null references public.clients(id) on delete cascade,
  prompt      text not null,
  created_at  timestamptz not null default now()
);
create index if not exists ai_prompts_client_idx on public.ai_prompts(client_id);

-- One row per check: web presence of an article, or an AI answer for a prompt.
create table if not exists public.seo_checks (
  id           uuid primary key default gen_random_uuid(),
  agency_id    uuid not null references public.agencies(id) on delete cascade,
  client_id    uuid not null references public.clients(id) on delete cascade,
  article_id   uuid references public.seo_articles(id) on delete cascade,
  prompt_id    uuid references public.ai_prompts(id) on delete cascade,
  kind         text not null,          -- web | ai
  engine       text not null,          -- claude-web-search | claude
  query        text not null,
  found        boolean not null default false,
  position     int,                    -- 1-based rank among results / brands named
  detail       jsonb not null default '{}'::jsonb,  -- excerpt, competitors, sources
  created_at   timestamptz not null default now()
);
create index if not exists seo_checks_article_idx on public.seo_checks(article_id);
create index if not exists seo_checks_prompt_idx on public.seo_checks(prompt_id);

alter table public.site_connections enable row level security;
alter table public.seo_articles     enable row level security;
alter table public.ai_prompts       enable row level security;
alter table public.seo_checks       enable row level security;

drop policy if exists site_connections_staff_all on public.site_connections;
create policy site_connections_staff_all on public.site_connections
  for all using (agency_id = public.current_agency_id() and public.is_agency_staff())
  with check (agency_id = public.current_agency_id() and public.is_agency_staff());

drop policy if exists seo_articles_staff_all on public.seo_articles;
create policy seo_articles_staff_all on public.seo_articles
  for all using (agency_id = public.current_agency_id() and public.is_agency_staff())
  with check (agency_id = public.current_agency_id() and public.is_agency_staff());

drop policy if exists ai_prompts_staff_all on public.ai_prompts;
create policy ai_prompts_staff_all on public.ai_prompts
  for all using (agency_id = public.current_agency_id() and public.is_agency_staff())
  with check (agency_id = public.current_agency_id() and public.is_agency_staff());

drop policy if exists seo_checks_staff_all on public.seo_checks;
create policy seo_checks_staff_all on public.seo_checks
  for all using (agency_id = public.current_agency_id() and public.is_agency_staff())
  with check (agency_id = public.current_agency_id() and public.is_agency_staff());

drop trigger if exists trg_site_connections_updated on public.site_connections;
create trigger trg_site_connections_updated before update on public.site_connections
  for each row execute function public.set_updated_at();
drop trigger if exists trg_seo_articles_updated on public.seo_articles;
create trigger trg_seo_articles_updated before update on public.seo_articles
  for each row execute function public.set_updated_at();
