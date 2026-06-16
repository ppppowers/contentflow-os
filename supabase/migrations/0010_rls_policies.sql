-- 0010 — Row Level Security
-- Default-deny: enable RLS on every table; only listed policies grant access.
-- Tenant isolation everywhere via current_agency_id(). Staff vs client via helpers.
-- Onboarding (create agency + first profile) runs with the service-role key, which
-- bypasses RLS — so there are intentionally no INSERT policies for agencies/profiles.

-- Client-scope helper (SECURITY DEFINER avoids cross-table RLS recursion).
create or replace function public.is_my_client_project(p uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.content_projects cp
    join public.client_user_links l on l.client_id = cp.client_id
    where cp.id = p and l.profile_id = auth.uid()
  )
$$;

-- Views must respect caller RLS, not the view owner's.
alter view public.v_agency_mrr  set (security_invoker = on);
alter view public.v_client_ltv  set (security_invoker = on);

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------
alter table public.agencies            enable row level security;
alter table public.profiles            enable row level security;
alter table public.client_user_links   enable row level security;
alter table public.clients             enable row level security;
alter table public.client_contacts     enable row level security;
alter table public.brand_profiles      enable row level security;
alter table public.client_notes        enable row level security;
alter table public.packages            enable row level security;
alter table public.monthly_plans       enable row level security;
alter table public.intake_submissions  enable row level security;
alter table public.intake_items        enable row level security;
alter table public.intake_files        enable row level security;
alter table public.content_projects    enable row level security;
alter table public.agent_runs          enable row level security;
alter table public.agent_outputs       enable row level security;
alter table public.content_pieces      enable row level security;
alter table public.authenticity_scores enable row level security;
alter table public.approvals           enable row level security;
alter table public.revisions           enable row level security;
alter table public.subscriptions       enable row level security;
alter table public.revenue_events      enable row level security;
alter table public.audit_log           enable row level security;

-- ---------------------------------------------------------------------------
-- Tenancy / identity
-- ---------------------------------------------------------------------------
create policy agencies_member_select on public.agencies
  for select using (id = public.current_agency_id());
create policy agencies_admin_update on public.agencies
  for update using (id = public.current_agency_id() and public.is_agency_admin())
  with check (id = public.current_agency_id() and public.is_agency_admin());

create policy profiles_agency_select on public.profiles
  for select using (agency_id = public.current_agency_id());
create policy profiles_admin_write on public.profiles
  for all using (agency_id = public.current_agency_id() and public.is_agency_admin())
  with check (agency_id = public.current_agency_id() and public.is_agency_admin());

create policy links_admin_all on public.client_user_links
  for all using (agency_id = public.current_agency_id() and public.is_agency_admin())
  with check (agency_id = public.current_agency_id() and public.is_agency_admin());
create policy links_self_select on public.client_user_links
  for select using (profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Staff-only tenant tables (owner/admin/writer): one ALL policy each
-- ---------------------------------------------------------------------------
create policy clients_staff_all on public.clients
  for all using (agency_id = public.current_agency_id() and public.is_agency_staff())
  with check (agency_id = public.current_agency_id() and public.is_agency_staff());

create policy contacts_staff_all on public.client_contacts
  for all using (agency_id = public.current_agency_id() and public.is_agency_staff())
  with check (agency_id = public.current_agency_id() and public.is_agency_staff());

create policy brand_staff_all on public.brand_profiles
  for all using (agency_id = public.current_agency_id() and public.is_agency_staff())
  with check (agency_id = public.current_agency_id() and public.is_agency_staff());

create policy notes_staff_all on public.client_notes
  for all using (agency_id = public.current_agency_id() and public.is_agency_staff())
  with check (agency_id = public.current_agency_id() and public.is_agency_staff());

create policy plans_staff_all on public.monthly_plans
  for all using (agency_id = public.current_agency_id() and public.is_agency_staff())
  with check (agency_id = public.current_agency_id() and public.is_agency_staff());

create policy intake_sub_staff_all on public.intake_submissions
  for all using (agency_id = public.current_agency_id() and public.is_agency_staff())
  with check (agency_id = public.current_agency_id() and public.is_agency_staff());

create policy intake_items_staff_all on public.intake_items
  for all using (agency_id = public.current_agency_id() and public.is_agency_staff())
  with check (agency_id = public.current_agency_id() and public.is_agency_staff());

create policy intake_files_staff_all on public.intake_files
  for all using (agency_id = public.current_agency_id() and public.is_agency_staff())
  with check (agency_id = public.current_agency_id() and public.is_agency_staff());

create policy agent_runs_staff_all on public.agent_runs
  for all using (agency_id = public.current_agency_id() and public.is_agency_staff())
  with check (agency_id = public.current_agency_id() and public.is_agency_staff());

create policy agent_outputs_staff_all on public.agent_outputs
  for all using (agency_id = public.current_agency_id() and public.is_agency_staff())
  with check (agency_id = public.current_agency_id() and public.is_agency_staff());

create policy authenticity_staff_all on public.authenticity_scores
  for all using (agency_id = public.current_agency_id() and public.is_agency_staff())
  with check (agency_id = public.current_agency_id() and public.is_agency_staff());

create policy revisions_staff_all on public.revisions
  for all using (agency_id = public.current_agency_id() and public.is_agency_staff())
  with check (agency_id = public.current_agency_id() and public.is_agency_staff());

-- ---------------------------------------------------------------------------
-- Mixed: staff full + client read (portal-ready, agency-only until links exist)
-- ---------------------------------------------------------------------------
create policy projects_staff_all on public.content_projects
  for all using (agency_id = public.current_agency_id() and public.is_agency_staff())
  with check (agency_id = public.current_agency_id() and public.is_agency_staff());
create policy projects_client_select on public.content_projects
  for select using (
    agency_id = public.current_agency_id()
    and client_id in (select public.current_client_ids())
  );

create policy pieces_staff_all on public.content_pieces
  for all using (agency_id = public.current_agency_id() and public.is_agency_staff())
  with check (agency_id = public.current_agency_id() and public.is_agency_staff());
create policy pieces_client_select on public.content_pieces
  for select using (
    agency_id = public.current_agency_id()
    and public.is_my_client_project(project_id)
  );

create policy approvals_staff_all on public.approvals
  for all using (agency_id = public.current_agency_id() and public.is_agency_staff())
  with check (agency_id = public.current_agency_id() and public.is_agency_staff());
-- Clients may read their project's approvals and act on client-stage approvals.
create policy approvals_client_select on public.approvals
  for select using (
    agency_id = public.current_agency_id()
    and public.is_my_client_project(project_id)
  );
create policy approvals_client_update on public.approvals
  for update using (
    agency_id = public.current_agency_id()
    and stage = 'client'
    and public.is_my_client_project(project_id)
  )
  with check (
    agency_id = public.current_agency_id()
    and stage = 'client'
    and public.is_my_client_project(project_id)
  );

-- ---------------------------------------------------------------------------
-- Packages: staff read, admin write
-- ---------------------------------------------------------------------------
create policy packages_staff_select on public.packages
  for select using (agency_id = public.current_agency_id() and public.is_agency_staff());
create policy packages_admin_write on public.packages
  for all using (agency_id = public.current_agency_id() and public.is_agency_admin())
  with check (agency_id = public.current_agency_id() and public.is_agency_admin());

-- ---------------------------------------------------------------------------
-- Revenue: admin only (owner/admin)
-- ---------------------------------------------------------------------------
create policy subscriptions_admin_all on public.subscriptions
  for all using (agency_id = public.current_agency_id() and public.is_agency_admin())
  with check (agency_id = public.current_agency_id() and public.is_agency_admin());

create policy revenue_admin_all on public.revenue_events
  for all using (agency_id = public.current_agency_id() and public.is_agency_admin())
  with check (agency_id = public.current_agency_id() and public.is_agency_admin());

-- ---------------------------------------------------------------------------
-- Audit log: any staff may write; only admins read
-- ---------------------------------------------------------------------------
create policy audit_staff_insert on public.audit_log
  for insert with check (agency_id = public.current_agency_id() and public.is_agency_staff());
create policy audit_admin_select on public.audit_log
  for select using (agency_id = public.current_agency_id() and public.is_agency_admin());
