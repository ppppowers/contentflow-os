-- 0016 — Knowledge Vault: searchable document intelligence
-- Durable document store (distinct from monthly intake_files): brand guides, SOPs,
-- flyers, brochures, logos, images, meeting notes. Each doc carries extracted text
-- + a summary + tags so Claude can SEARCH the vault before writing content.
--
-- client_id NULL = agency-wide doc (e.g. an agency SOP) visible to all staff.

create type vault_doc_type as enum (
  'pdf', 'flyer', 'logo', 'image', 'brochure', 'brand_guide', 'sop', 'meeting_notes', 'other'
);

create table public.vault_documents (
  id             uuid primary key default gen_random_uuid(),
  agency_id      uuid not null references public.agencies(id) on delete cascade,
  client_id      uuid references public.clients(id) on delete cascade,  -- null = agency-wide
  title          text not null,
  doc_type       vault_doc_type not null default 'other',
  storage_path   text not null,
  file_name      text not null,
  mime_type      text,
  size_bytes     bigint,
  tags           text[] not null default '{}',
  extracted_text text not null default '',   -- document intelligence (Claude)
  summary        text not null default '',    -- document intelligence (Claude)
  analyzed       boolean not null default false,
  created_by     uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- Full-text search vector over title + summary + extracted text + tags.
  search         tsvector generated always as (
    public.search_vector(title, summary, extracted_text, tags)
  ) stored
);
create index vault_documents_agency_client_idx on public.vault_documents(agency_id, client_id);
create index vault_documents_search_idx on public.vault_documents using gin(search);
create index vault_documents_tags_idx on public.vault_documents using gin(tags);

create trigger trg_vault_documents_updated before update on public.vault_documents
  for each row execute function public.set_updated_at();

-- RLS: staff-only, tenant-scoped. Agency-wide (client_id null) docs included.
alter table public.vault_documents enable row level security;
create policy vault_documents_staff_all on public.vault_documents
  for all using (agency_id = public.current_agency_id() and public.is_agency_staff())
  with check (agency_id = public.current_agency_id() and public.is_agency_staff());

-- Private storage bucket. Path: {agency_id}/{client_id|'agency'}/{uuid}-{filename}
insert into storage.buckets (id, name, public)
values ('vault', 'vault', false)
on conflict (id) do nothing;

create policy "vault_staff_select" on storage.objects
  for select using (
    bucket_id = 'vault'
    and (storage.foldername(name))[1] = public.current_agency_id()::text
    and public.is_agency_staff()
  );
create policy "vault_staff_insert" on storage.objects
  for insert with check (
    bucket_id = 'vault'
    and (storage.foldername(name))[1] = public.current_agency_id()::text
    and public.is_agency_staff()
  );
create policy "vault_staff_delete" on storage.objects
  for delete using (
    bucket_id = 'vault'
    and (storage.foldername(name))[1] = public.current_agency_id()::text
    and public.is_agency_staff()
  );
