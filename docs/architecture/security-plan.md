# Security Plan

Defense in depth: tenant isolation at the database (RLS), authorization at the app, validation at every boundary, secrets server-side only, audit trail on sensitive actions.

## 1. Tenancy isolation (primary control)
- Every business table has `agency_id`. **RLS policies scope every read/write to the caller's `agency_id`**, derived from the JWT — not from request params.
- JWT carries `agency_id` + `role` as custom claims (set on signup / via Auth hook). RLS reads `auth.jwt()`, never trusts client-supplied tenant ids.
- Default-deny: tables have RLS enabled with no permissive fallback. A missing policy = no access.
- Cross-tenant read attempt returns zero rows (verified by integration test per table in Phase 2/13).

## 2. Authentication
- Supabase Auth. Sessions via httpOnly cookies; `middleware.ts` refreshes tokens.
- Password reset, email verification standard flows.
- Service-role key used **only** in trusted server contexts that legitimately bypass RLS (e.g. cross-tenant admin jobs) — never in user-request CRUD paths, never shipped to client.

## 3. Authorization (roles)
Roles: `owner | admin | writer | client`.
| Capability | owner | admin | writer | client |
|-----------|:-----:|:-----:|:-----:|:------:|
| Manage agency settings/billing | ✓ | – | – | – |
| Manage users/roles | ✓ | ✓ | – | – |
| CRUD clients/brand/intake | ✓ | ✓ | ✓ | – |
| Run agents / generate content | ✓ | ✓ | ✓ | – |
| Internal approval | ✓ | ✓ | ✓ | – |
| View own client content (scoped) | – | – | – | ✓ |
| Client approval / request revisions | – | – | – | ✓ |
| View revenue | ✓ | ✓ | – | – |

- Enforced twice: **RLS** (data layer) + **route/action guards** (`lib/auth/guards.ts`) for UX + defense in depth.
- `client` role additionally scoped via `client_user_links` — sees only the linked client's projects/approvals, read-mostly.

## 4. Input validation
- **All** inputs Zod-parsed server-side (forms, server actions, route handlers) — client validation is UX only.
- File uploads: validate mime type + size server-side; store in Supabase Storage under tenant-scoped paths; serve via **signed URLs** with short TTL (no public buckets for client data).
- Agent outputs from Claude Zod-validated before persistence — untrusted model output treated as untrusted input.

## 5. Secrets & API keys
- `ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` server-only env vars; never in `NEXT_PUBLIC_*`, never imported into client bundles.
- `lib/claude/*` and service-role Supabase client are server-only modules.
- `.env.local.example` documents required vars without values. Secrets live in Vercel/Supabase env stores.

## 6. AI-specific risks
- **Prompt injection** via intake content / website text: agent prompts treat client-supplied text as data, not instructions; system prompts fixed in code; outputs schema-constrained (model can't return arbitrary actions).
- **PII / confidentiality:** client data sent to Claude is scoped to that tenant's project only; no cross-client context bleed (memory assembler enforces). Document data-processing in client terms (white-label phase).
- **Cost/abuse:** per-run token + cost captured; rate limits on agent endpoints; bounded rewrite loops.

## 7. Audit logging
- `audit_log` records sensitive mutations: auth/role changes, billing changes, deletes, approvals.
- `agent_runs` is the immutable AI action trail (who/what/when/model/cost).
- Append-only; surfaced in Phase 13 review.

## 8. Transport & platform
- HTTPS everywhere (Vercel default). Secure, httpOnly, sameSite cookies.
- Security headers (CSP, HSTS, X-Frame-Options) set in `next.config` / middleware before deploy (Phase 13/14).
- Dependency vuln scan + secret scan in CI before production (Phase 13).

## 9. Verification (gates)
- Phase 2: RLS policy tests — every table proven tenant-isolated.
- Phase 3: role matrix tests — each role can/can't do exactly the table above.
- Phase 13: full security audit (RLS, authz, secrets, headers, deps, injection).
