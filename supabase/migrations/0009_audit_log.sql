-- 0009 — Audit log for sensitive mutations (auth/role, billing, deletes, approvals)

create table public.audit_log (
  id           uuid primary key default gen_random_uuid(),
  agency_id    uuid not null references public.agencies(id) on delete cascade,
  actor_id     uuid references public.profiles(id) on delete set null,
  action       text not null,
  entity_type  text not null,
  entity_id    uuid,
  diff         jsonb not null default '{}'::jsonb,
  ip           inet,
  created_at   timestamptz not null default now()
);
create index audit_log_agency_time_idx on public.audit_log(agency_id, created_at);
