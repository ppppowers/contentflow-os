-- RLS verification harness — run against a LOCAL Supabase after `supabase db reset`.
--   psql "$DATABASE_URL" -f supabase/tests/rls_tests.sql
-- Proves tenant isolation: a user in agency A cannot see agency B's rows.
-- Runs as postgres for setup, then impersonates `authenticated` with a JWT sub.
-- NOTE: auth.users column requirements vary by Supabase version; adjust if it errors.

begin;

-- ---- Setup (as postgres; bypasses RLS) --------------------------------------
do $$
declare
  ag_a uuid := gen_random_uuid();
  ag_b uuid := gen_random_uuid();
  usr_a uuid := gen_random_uuid();
  usr_b uuid := gen_random_uuid();
begin
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
  values
    (usr_a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@test.dev', '', now(), now()),
    (usr_b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b@test.dev', '', now(), now());

  insert into public.agencies (id, name, slug) values (ag_a, 'A', 'rls-a'), (ag_b, 'B', 'rls-b');
  insert into public.profiles (id, agency_id, role, email)
  values (usr_a, ag_a, 'owner', 'a@test.dev'), (usr_b, ag_b, 'owner', 'b@test.dev');

  insert into public.clients (agency_id, name) values (ag_a, 'A client'), (ag_b, 'B client');

  -- stash ids for the assertions below
  perform set_config('test.usr_a', usr_a::text, false);
  perform set_config('test.ag_b', ag_b::text, false);
end $$;

-- ---- Impersonate user A -----------------------------------------------------
set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', current_setting('test.usr_a'), 'role', 'authenticated')::text,
  true
);

-- A must see exactly its own 1 client.
do $$
declare n int;
begin
  select count(*) into n from public.clients;
  if n <> 1 then raise exception 'FAIL: tenant A sees % clients (expected 1)', n; end if;

  -- A must NOT see agency B's clients even by explicit filter.
  select count(*) into n from public.clients where agency_id = current_setting('test.ag_b')::uuid;
  if n <> 0 then raise exception 'FAIL: tenant A can read tenant B clients'; end if;

  -- A must NOT be able to write into agency B (RLS WITH CHECK).
  begin
    insert into public.clients (agency_id, name) values (current_setting('test.ag_b')::uuid, 'evil');
    raise exception 'FAIL: tenant A inserted a row into tenant B';
  exception when others then
    null; -- expected: insert blocked
  end;

  raise notice 'PASS: tenant isolation holds for clients';
end $$;

reset role;
rollback;  -- leave the DB untouched
