-- 0012 — Private storage bucket for intake uploads + path-scoped RLS.
-- Path convention: {agency_id}/{client_id}/{submission_id}/{filename}
-- First path segment = agency_id → tenant isolation enforced on storage.objects.

insert into storage.buckets (id, name, public)
values ('intake', 'intake', false)
on conflict (id) do nothing;

-- Staff of the owning agency may read/write/delete objects under their agency prefix.
create policy "intake_staff_select" on storage.objects
  for select using (
    bucket_id = 'intake'
    and (storage.foldername(name))[1] = public.current_agency_id()::text
    and public.is_agency_staff()
  );

create policy "intake_staff_insert" on storage.objects
  for insert with check (
    bucket_id = 'intake'
    and (storage.foldername(name))[1] = public.current_agency_id()::text
    and public.is_agency_staff()
  );

create policy "intake_staff_delete" on storage.objects
  for delete using (
    bucket_id = 'intake'
    and (storage.foldername(name))[1] = public.current_agency_id()::text
    and public.is_agency_staff()
  );
