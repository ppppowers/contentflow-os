# Phase 2 — Supabase Database (delivered)

Migrations in `supabase/migrations/`, applied in order. Seed in `supabase/seed.sql`.

## Migration order
| File | Contents |
|------|----------|
| `0001_extensions_and_enums.sql` | pgcrypto, citext; all 13 enum types |
| `0002_helpers.sql` | `current_agency_id()`, `current_user_role()`, `is_agency_staff/admin()`, `current_client_ids()`, `set_updated_at()` |
| `0003_tenancy_identity.sql` | `agencies`, `profiles`, `client_user_links` |
| `0004_clients.sql` | `clients`, `client_contacts`, `brand_profiles`, `client_notes`, `packages`, `monthly_plans` |
| `0005_intake.sql` | `intake_submissions`, `intake_items`, `intake_files` |
| `0006_content_pipeline.sql` | `content_projects`, `agent_runs`, `agent_outputs`, `content_pieces`, `authenticity_scores` |
| `0007_approvals.sql` | `approvals`, `revisions` |
| `0008_revenue.sql` | `subscriptions`, `revenue_events`, `v_agency_mrr`, `v_client_ltv` |
| `0009_audit_log.sql` | `audit_log` |
| `0010_rls_policies.sql` | RLS enable + all policies + `is_my_client_project()` |

## RLS model (default-deny)
- Every table has RLS enabled. No permissive fallback.
- **Tenant isolation:** every policy requires `agency_id = current_agency_id()`. Tenant id comes from the user's `profiles` row (via SECURITY DEFINER helper), never from request input.
- **Staff tables** (clients, brand, intake, content pipeline, etc.): one `FOR ALL` policy gated by `is_agency_staff()` (owner/admin/writer).
- **Client portal** (`content_projects`, `content_pieces`, `approvals`): extra SELECT policies scoped by `current_client_ids()` / `is_my_client_project()`. Clients can also UPDATE their own `stage='client'` approvals. Inert until a `client_user_links` row exists → matches "agency-only first" default.
- **Revenue** (`subscriptions`, `revenue_events`): admin-only (owner/admin). `packages`: staff read, admin write.
- **Audit log:** staff insert, admin read. Append-only by convention.
- **Views** set `security_invoker = on` so MRR/LTV respect caller RLS (no cross-tenant leak).
- **Onboarding** (first agency + profile) uses the service-role key, which bypasses RLS — so no INSERT policy exists for `agencies`/`profiles`.

## Why tenant id from profiles, not JWT
Works immediately without configuring a custom access-token hook. Phase 3 can add the hook to put `agency_id`/`role` in the JWT and switch helpers to read `auth.jwt()` for fewer lookups — policies stay identical.

## Seed (`seed.sql`)
One agency, 2 packages, 2 clients with brand profiles (real banned-phrase lists), contacts, 2 active subscriptions (MRR = $2,250), paid revenue events, one submitted intake with 3 items, one content project at `intake_received`. Profiles omitted (need real auth signups) → `created_by` left null.

## How to apply (Phase 14 covers full deploy)
```bash
supabase start                 # local stack
supabase db reset              # runs migrations + seed.sql
# or against a project:
supabase db push
```

## Verification checklist (run in Phase 3/13)
- [ ] All 22 tables have `rowsecurity = true`.
- [ ] Tenant A user reads 0 rows of Tenant B (per-table integration test).
- [ ] `v_agency_mrr` for an agency returns only that agency's MRR.
- [ ] Writer cannot select `revenue_events`; admin can.
- [ ] Client login (with link) sees only its own projects/pieces/approvals.
- [ ] `supabase db reset` runs clean start-to-finish.

## Open follow-ups (not blockers)
- Storage bucket + RLS for `intake_files` paths → Phase 6.
- Custom access-token hook (JWT claims) → Phase 3.
- Stripe-synced billing → later (manual billing now, per locked default).
