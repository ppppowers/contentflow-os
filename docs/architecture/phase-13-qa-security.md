# Phase 13 — QA & Security Audit (delivered)

Security, code, database, and performance review of everything built (Phases 1–12), with fixes applied and residual risks logged.

## Fixes applied this phase
| # | Severity | Finding | Fix |
|---|----------|---------|-----|
| 1 | High | No HTTP security headers (clickjacking, MIME sniff, no CSP/HSTS) | `next.config.mjs` now sets CSP, HSTS, X-Frame-Options DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy on all routes |
| 2 | High | Middleware redirected authenticated users off `/reset-password` → **Supabase recovery flow broken** (user could never set a new password) | Middleware exempts `/reset-password`; added `UpdatePassword` component that detects the recovery session and sets the new password |
| 3 | Med | Auth-page redirect sent everyone to `/dashboard` (clients bounced through a guard) | Redirect to `/` (role router) instead |
| 4 | Med | No automated tenant-isolation proof | `supabase/tests/rls_tests.sql` — impersonates `authenticated`, asserts a tenant can't read or write another tenant's rows |
| 5 | Med | No unit tests on the authenticity scorer (core trust logic) | `tests/unit/authenticity.test.ts` + Vitest (`npm test`) |

## Security review — verified OK
- **Tenant isolation:** RLS on all 22 tables, `agency_id` from `profiles`/JWT (never request input); views are `security_invoker`. Verified by the SQL harness.
- **Service-role usage is confined and gated:** only `signUpAction` (onboarding) and `clientDecision` (after explicit ownership verification). No other path bypasses RLS. (Grep-confirmed.)
- **Secrets server-only:** `ANTHROPIC_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` read only in server modules; never `NEXT_PUBLIC_*`, never in a client bundle.
- **Authorization defense-in-depth:** RLS + `requireStaff/Admin/Client` guards + per-action role rechecks + revenue gated in the data layer (writer payloads carry no MRR).
- **Input validation:** every Server Action and API route Zod-validates; agent (Claude) output Zod-validated before persistence.
- **XSS:** React auto-escapes; the only hand-built HTML (export route) escapes piece content; no `dangerouslySetInnerHTML`.
- **Storage:** private `intake` bucket, path-scoped RLS, short-TTL signed download URLs; upload path validated twice.
- **AI/prompt injection:** client/intake text passed as data, system prompts fixed in code, outputs schema-constrained.

## Database review
- FKs + `on delete cascade` consistent; every table indexed on `agency_id` plus hot paths (`content_projects(agency_id,status)`, `agent_runs(project_id,started_at)`, `agent_outputs(project_id,agent)`).
- Revenue is an append-only ledger; MRR/LTV are views (no stored-total drift).
- Unique constraints prevent duplicate intake/monthly-plan rows.

## Performance review
- Dashboard + lists are server-rendered, RLS-scoped, parallelized (`Promise.all`).
- JS aggregation (pipeline counts, MRR rollups) is fine at agency scale.
- Agent runs are Route Handlers (`maxDuration=300`), each step independently invokable.

## Residual risks / recommendations (not blocking; track for prod)
1. **Rate-limiting on agent endpoints** — `/api/pipeline/run` and `/api/agents/[agent]` are auth-gated but unthrottled; a malicious staff user could rack up Claude spend. Add a per-user concurrency/rate limit before opening to untrusted operators.
2. **CSP uses `'unsafe-inline'`/`'unsafe-eval'`** for scripts — pragmatic for Next without a nonce pipeline. Tighten to nonce-based when hardening.
3. **API route CSRF** — mutations are same-origin `fetch` with sameSite cookies; consider an explicit `Origin` check or moving to Server Actions (which have built-in CSRF protection) for defense in depth.
4. **Email confirmation is OFF in dev** (`config.toml`) — must be ON for production (Phase 14 checklist).
5. **List/dashboard pagination** — unbounded selects are fine now; add pagination before a tenant has thousands of projects.
6. **`materializePieces` delete+insert** clobbers manual edits on a fresh gate-pass (documented Phase 8) — add a "re-materialize" confirm if this bites.
7. **Client-user invite UI** still pending (since Phase 3/5) — portal needs a `client_user_links` row created manually until then.
8. **Malware scanning** on uploads not implemented — add a scan step if untrusted clients upload.

## How to run the checks
```bash
npm install
npm test                                   # authenticity unit tests
supabase db reset
psql "$DATABASE_URL" -f supabase/tests/rls_tests.sql   # tenant-isolation proof
npm run build                              # type + build check
```

## Verdict
No critical or high-severity issue left unfixed. Items 1–4 above are the recommended hardening before exposing the app beyond the trusted internal owner — folded into the Phase 14 production checklist.
