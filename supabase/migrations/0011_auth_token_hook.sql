-- 0011 — Custom access token hook: stamp agency_id + role into the JWT.
-- After this, RLS helpers can read claims directly (faster, no per-call lookup).
-- Configure in supabase/config.toml:
--   [auth.hook.custom_access_token]
--   enabled = true
--   uri = "pg-functions://postgres/public/custom_access_token_hook"

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  claims     jsonb;
  v_agency   uuid;
  v_role     user_role;
begin
  select agency_id, role into v_agency, v_role
  from public.profiles
  where id = (event->>'user_id')::uuid;

  claims := event->'claims';
  if v_agency is not null then
    claims := jsonb_set(claims, '{agency_id}', to_jsonb(v_agency::text));
    claims := jsonb_set(claims, '{user_role}', to_jsonb(v_role::text));
  end if;

  return jsonb_set(event, '{claims}', claims);
end;
$$;

-- Auth admin must execute the hook; lock it down from public roles.
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;

-- Upgrade helpers: prefer JWT claim, fall back to profiles lookup.
-- Policies are unchanged — they keep calling current_agency_id()/current_user_role().
create or replace function public.current_agency_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    nullif(auth.jwt() -> 'agency_id', 'null')::text::uuid,
    (select agency_id from public.profiles where id = auth.uid())
  )
$$;

create or replace function public.current_user_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (nullif(auth.jwt() ->> 'user_role', ''))::user_role,
    (select role from public.profiles where id = auth.uid())
  )
$$;
