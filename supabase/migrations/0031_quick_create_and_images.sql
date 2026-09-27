-- 0031 — Quick "Create content" flow + AI images.
-- 1. content_projects.brief: a free-text brief typed on the Create page, used by
--    the agents alongside (or instead of) monthly intake items.
-- 2. content_images: images generated for a project (optionally tied to a piece).
-- 3. Private 'content-images' bucket, agency-prefixed paths, same RLS pattern as intake.

alter table public.content_projects
  add column if not exists brief text,
  add column if not exists options jsonb not null default '{}'::jsonb;  -- { images: boolean }

create table if not exists public.content_images (
  id            uuid primary key default gen_random_uuid(),
  agency_id     uuid not null references public.agencies(id) on delete cascade,
  project_id    uuid not null references public.content_projects(id) on delete cascade,
  piece_id      uuid references public.content_pieces(id) on delete set null,
  channel       text,                 -- which piece it was made for (survives piece regen)
  prompt        text not null,
  storage_path  text not null,        -- {agency_id}/{project_id}/{uuid}.png
  model         text,
  size          text,
  cost_usd      numeric(10,4),
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index if not exists content_images_project_idx on public.content_images(project_id);

alter table public.content_images enable row level security;

create policy content_images_staff_all on public.content_images
  for all using (agency_id = public.current_agency_id() and public.is_agency_staff())
  with check (agency_id = public.current_agency_id() and public.is_agency_staff());
create policy content_images_client_select on public.content_images
  for select using (
    agency_id = public.current_agency_id()
    and public.is_my_client_project(project_id)
  );

insert into storage.buckets (id, name, public)
values ('content-images', 'content-images', false)
on conflict (id) do nothing;

create policy "content_images_staff_select" on storage.objects
  for select using (
    bucket_id = 'content-images'
    and (storage.foldername(name))[1] = public.current_agency_id()::text
    and public.is_agency_staff()
  );

create policy "content_images_staff_insert" on storage.objects
  for insert with check (
    bucket_id = 'content-images'
    and (storage.foldername(name))[1] = public.current_agency_id()::text
    and public.is_agency_staff()
  );

create policy "content_images_staff_delete" on storage.objects
  for delete using (
    bucket_id = 'content-images'
    and (storage.foldername(name))[1] = public.current_agency_id()::text
    and public.is_agency_staff()
  );
