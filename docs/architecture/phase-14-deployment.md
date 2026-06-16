# Phase 14 — Deployment (delivered)

Final phase. Production deployment artifacts: env documentation, Supabase + Vercel guide, production checklist, and project entry docs.

## What shipped
| File | Purpose |
|------|---------|
| `README.md` | Project overview, quick start, env table, layout |
| `docs/DEPLOYMENT.md` | Full Supabase + Vercel deploy guide + production checklist + rollback + cost notes |
| `.gitignore` | Excludes `node_modules`, `.next`, **all env files**, build artifacts |
| `.env.local.example` | (Phase 3) the canonical env var list |

## Deploy path (summary)
1. **Supabase:** `supabase link` → `db push` (migrations 0001–0012) → enable the custom access-token hook → turn email confirmations **ON** → confirm `intake` bucket → run the RLS isolation test.
2. **Vercel:** import repo → set 5 env vars (2 secret) → deploy. Agent routes use `maxDuration=300`.
3. **First run:** `/signup` (owner) → client + brand profile → intake → create project → run pipeline.

## Production checklist (condensed — full list in DEPLOYMENT.md)
- Email confirmations ON · secrets marked Sensitive · RLS test passes · security headers verified.
- **Add rate-limiting** to agent endpoints · tighten CSP to nonce.
- Backups/PITR on · seed NOT in prod · `npm run build` + `npm test` green · custom domain.
- Error tracking + Anthropic spend alerts (every run logs `cost_usd`).
- Client-invite UI before opening the portal.

## Final state — all 14 phases complete
| Phase | Delivered |
|-------|-----------|
| 1 | Architecture (folder, DB, technical, agent, security) |
| 2 | Supabase schema — 22 tables, RLS, seed |
| 3 | Auth & roles (owner/admin/writer/client), JWT hook |
| 4 | Agency dashboard (KPIs, MRR, clients, pipeline) |
| 5 | Client management (CRUD, brand, contacts, notes) |
| 6 | Monthly intake (8 types, uploads, workflow) |
| 7 | Agent framework (orchestration, memory, gates, audit) |
| 8 | Content engine (craft prompts, per-piece editing) |
| 9 | Humanization (scanner + LLM, rewrite loop) |
| 10 | Approvals (internal + client review, revisions) |
| 11 | Revenue (MRR/LTV, subscriptions, manual billing) |
| 12 | Export (PDF/HTML/MD, copy, archive) |
| 13 | QA & security audit (fixes + tests + RLS harness) |
| 14 | Deployment (this) |

## Known follow-ups (carried forward, none blocking internal use)
- Client-user invite UI (`client_user_links`) — portal needs a row created manually until built.
- Rate-limiting on agent endpoints before exposing to untrusted operators.
- Stripe-synced billing (manual now).
- Nonce-based CSP; malware scan on uploads; pagination at scale.

The codebase is production-ready for the internal agency-owner use case, with the hardening items above tracked for the white-label expansion.
