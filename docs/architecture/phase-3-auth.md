# Phase 3 — Authentication & Roles (delivered)

Supabase Auth (email/password) + multi-tenant role model. Roles: `owner`, `admin`, `writer`, `client`. App scaffold (Next.js 14 App Router) now boots.

## What shipped
| Area | Files |
|------|-------|
| App scaffold | `package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`, `app/globals.css`, `.env.local.example` |
| Supabase clients | `lib/supabase/{client,server,middleware}.ts` |
| Session middleware | `middleware.ts` (refresh + route protection) |
| JWT claims hook | `supabase/migrations/0011_auth_token_hook.sql` + `supabase/config.toml` |
| Role model | `lib/auth/roles.ts` (capability matrix) |
| Server guards | `lib/auth/guards.ts` (`requireStaff/Admin/Client`) |
| Auth actions | `lib/auth/actions.ts` (signin/signup/signout/reset) |
| Validation | `lib/validation/auth.ts` (Zod) |
| Auth UI | `app/(auth)/{login,signup,reset-password}` + `components/auth/SubmitButton.tsx` |
| Role shells | `app/(agency)/*`, `app/(client-portal)/*`, `app/page.tsx` (role router) |

## How auth works
1. **Session:** `middleware.ts` calls `updateSession()` on every request — refreshes the Supabase cookie and validates the JWT with `getUser()` (never trusts `getSession` alone). Unauthenticated → `/login`; authenticated on an auth page → `/dashboard`.
2. **Signup = new agency.** `signUpAction` creates the auth user, then (via **service role**, which bypasses RLS) creates the `agencies` row + an `owner` `profiles` row. This is why Phase 2 intentionally has no INSERT policy on `agencies`/`profiles`.
3. **JWT claims.** Migration `0011` adds `custom_access_token_hook` stamping `agency_id` + `user_role` into the JWT. `current_agency_id()`/`current_user_role()` now read the claim first, fall back to a `profiles` lookup — **RLS policies are unchanged**.
4. **Authorization (defense in depth):**
   - **RLS** (Phase 2) is the real data boundary.
   - **Route guards** (`guards.ts`) gate the shells: `requireStaff` (agency), `requireClient` (portal), `requireAdmin` (revenue/settings).
   - **Capability matrix** (`roles.ts`, `CAN.*`) mirrors `security-plan.md` for UI gating.

## Role → access
| Role | Shell | Can |
|------|-------|-----|
| owner | `(agency)` | everything incl. settings, billing, users, revenue |
| admin | `(agency)` | users, clients, content, revenue |
| writer | `(agency)` | clients, content, run agents, internal approve |
| client | `(client-portal)` | view own client's content, approve/request revisions |

`homePathForRole()` routes clients to `/review`, staff to `/dashboard`.

## Invite flow (staff/clients) — note
Self-serve signup creates owners only. Admin-invites for `admin`/`writer`/`client` (insert `profiles` + `client_user_links` via service role, send invite email) are a thin follow-up — wired in Phase 5 (Client Management) where the client-user link UI lives. Hooks already exist (`client_user_links` table + client RLS policies from Phase 2).

## Setup steps (local)
```bash
cp .env.local.example .env.local      # fill Supabase + anon + service-role keys
npm install
supabase start                         # config.toml enables the auth hook
supabase db reset                      # migrations 0001–0011 + seed
npm run dev
```
Open `/signup` → create an agency → land on `/dashboard`.

## Security notes / review points
- Service-role key used **only** in `signUpAction` (onboarding). Never imported client-side; lives in `createServiceClient()` (server module).
- Auth hook locked to `supabase_auth_admin`; execute revoked from `anon/authenticated/public`.
- Password reset response is uniform (no account-existence leak).
- Email confirmations **off in dev** (`config.toml`) — turn **on** for production (Phase 14 checklist).
- ShadCN UI not yet installed — auth forms use plain Tailwind; swap in Phase 4 without changing actions/logic.

## Verification checklist
- [ ] `/signup` creates agency + owner profile; JWT contains `agency_id` + `user_role`.
- [ ] Writer hitting `/revenue` → redirected (requireAdmin).
- [ ] Client login → `/review`; cannot reach `/dashboard`.
- [ ] Logged-out request to any private route → `/login?next=…`.
- [ ] Two agencies: neither sees the other's data (RLS, re-verify after hook).
