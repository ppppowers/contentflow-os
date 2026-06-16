# Deployment Guide — ContentFlow OS

Target: **Vercel** (Next.js) + **Supabase** (Postgres/Auth/Storage). Claude via the Anthropic API.

---

## 1. Prerequisites
- A Supabase project (cloud).
- A Vercel account + this repo on GitHub.
- An Anthropic API key.
- Supabase CLI (`npm i -g supabase`) for migrations.

---

## 2. Supabase setup

### 2.1 Link + push the schema
```bash
supabase link --project-ref <your-project-ref>
supabase db push                 # applies supabase/migrations/0001–0012
```
Seed data is for local dev only — **do not** run `seed.sql` against production.

### 2.2 Configure the custom access token hook (JWT claims)
Migration `0011` defines `public.custom_access_token_hook`. Enable it so `agency_id` + `user_role` land in the JWT:
- Dashboard → **Authentication → Hooks → Custom Access Token** → enable → select `public.custom_access_token_hook`.
- (Local mirrors this via `supabase/config.toml` `[auth.hook.custom_access_token]`.)
> The app works without the hook (helpers fall back to a `profiles` lookup), but the hook removes a per-request query.

### 2.3 Auth settings (production)
Dashboard → **Authentication → Providers/Settings**:
- **Enable email confirmations: ON** (it's OFF in local dev — must be ON in prod).
- **Site URL:** your production URL (e.g. `https://app.example.com`).
- **Redirect URLs:** add `https://app.example.com/reset-password`.

### 2.4 Storage
The `intake` bucket + its RLS policies are created by migration `0012`. Confirm the bucket exists (Dashboard → Storage) after `db push`. It is **private** — access is via signed URLs only.

### 2.5 Verify tenant isolation
```bash
psql "$SUPABASE_DB_URL" -f supabase/tests/rls_tests.sql   # must print PASS
```

---

## 3. Environment variables

Set these in **Vercel → Project → Settings → Environment Variables** (Production + Preview):

| Var | Value source | Scope |
|-----|--------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API (anon) | public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API (service_role) | **secret** |
| `ANTHROPIC_API_KEY` | Anthropic console | **secret** |
| `NEXT_PUBLIC_SITE_URL` | your prod URL | public |

Mark the two secrets as **Sensitive** in Vercel. Never expose them with a `NEXT_PUBLIC_` prefix.

---

## 4. Deploy to Vercel
1. **Import** the GitHub repo in Vercel (framework auto-detected: Next.js).
2. Add the env vars above.
3. Build command `next build`, output handled automatically.
4. Deploy. Note: `/api/pipeline/run` and `/api/agents/[agent]` declare `maxDuration = 300` — ensure your Vercel plan allows the function duration you need for agent runs.

### First run
1. Visit `https://<your-domain>/signup` → create the agency (you become **owner**).
2. Confirm the email (confirmations are ON in prod).
3. Add a client → fill the **brand profile** (voice + banned phrases) → submit a monthly **intake** → **Create content project** → **Run pipeline**.

---

## 5. Production checklist

**Security**
- [ ] Email confirmations **ON** (§2.3).
- [ ] `SUPABASE_SERVICE_ROLE_KEY` + `ANTHROPIC_API_KEY` marked Sensitive; not in any client bundle.
- [ ] RLS isolation test passes (§2.5).
- [ ] Security headers present (set by `next.config.mjs`) — verify with `curl -I`.
- [ ] **Add rate-limiting** to `/api/pipeline/run` + `/api/agents/[agent]` (Claude-cost abuse) — see Phase 13 residuals.
- [ ] Tighten CSP to a nonce-based policy (currently `'unsafe-inline'` for Next).

**Data**
- [ ] Supabase automated backups enabled (PITR on paid tiers).
- [ ] `seed.sql` NOT applied to production.

**App**
- [ ] `npm run build` clean (types + lint).
- [ ] `npm test` green.
- [ ] Custom domain + HTTPS (Vercel handles TLS).
- [ ] `NEXT_PUBLIC_SITE_URL` matches the real domain (used in password-reset links).

**Ops**
- [ ] Error tracking wired (e.g. Sentry) — recommended next.
- [ ] Monitor Anthropic spend (every run logs `cost_usd` in `agent_runs` — build an alert).
- [ ] Client-user invite UI before opening the portal (still pending — see Phase 3/5).

---

## 6. Migrations & rollback
- New schema changes → add `supabase/migrations/00NN_*.sql`, `supabase db push`.
- Forward-only by default. For rollback, write a compensating migration; for data-loss-risk changes, take a snapshot first (Supabase → Database → Backups).
- App rollback: redeploy the previous Vercel deployment (instant).

---

## 7. Cost notes
- **Supabase:** free tier for internal use; paid for PITR backups + higher limits.
- **Vercel:** Hobby works for internal; Pro for longer function durations (agent runs).
- **Anthropic:** per-run cost captured in `agent_runs.cost_usd`. Strong tier = Opus 4.8 (writing/strategy/judgment), mid = Sonnet 4.6, cheap = Haiku 4.5 — tune `lib/agents/registry.ts` tiers to trade cost vs quality.
