-- 0002 — Helper functions + shared triggers
-- Tenant/role resolution reads from profiles (not JWT claims) via SECURITY DEFINER
-- so policies stay correct even before a custom access-token hook is configured.
--
-- These SQL functions reference tables created in later migrations (profiles,
-- client_user_links in 0003). Postgres validates LANGUAGE sql bodies at creation,
-- so defer that check — the relations exist by the time the functions are called.
set check_function_bodies = off;

-- Resolve current user's agency. SECURITY DEFINER bypasses RLS on profiles
-- (prevents recursion when policies call this).
create or replace function public.current_agency_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select agency_id from public.profiles where id = auth.uid()
$$;

create or replace function public.current_user_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- True for agency staff (everyone except external client logins).
create or replace function public.is_agency_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in ('owner', 'admin', 'writer')
$$;

create or replace function public.is_agency_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in ('owner', 'admin')
$$;

-- Client-role logins: the set of client_ids they may view.
create or replace function public.current_client_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select client_id from public.client_user_links where profile_id = auth.uid()
$$;

-- IMMUTABLE tsvector builder for generated full-text columns. Postgres rejects
-- to_tsvector(text-literal cfg, ...) and array_to_string in a generated column
-- (both resolve as STABLE). Doing the whole build inside one IMMUTABLE function —
-- taking the row's columns as args — satisfies the generated-column requirement.
create or replace function public.search_vector(a text, b text, c text, tags text[])
returns tsvector
language sql
immutable
set search_path = public, pg_catalog
as $$
  select to_tsvector('english',
    coalesce(a, '') || ' ' || coalesce(b, '') || ' ' || coalesce(c, '') || ' ' ||
    coalesce(array_to_string(tags, ' '), ''))
$$;

-- updated_at maintenance
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
