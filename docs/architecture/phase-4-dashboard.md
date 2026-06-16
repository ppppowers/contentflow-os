# Phase 4 — Agency Dashboard (delivered)

Server-rendered, RLS-scoped agency overview. KPI widgets + content pipeline + client overview, with revenue gated to admins.

## What shipped
| Area | Files |
|------|-------|
| Data layer | `lib/data/dashboard.ts` (`getDashboardData(role)`) |
| UI primitives | `components/ui/card.tsx`, `components/ui/badge.tsx` |
| Dashboard widgets | `components/dashboard/{StatCard,PipelineBar,ClientOverview}.tsx` |
| Dashboard page | `app/(agency)/dashboard/page.tsx` |
| Revenue overview | `app/(agency)/revenue/page.tsx` (admin) |
| Nav placeholders | `app/(agency)/{clients,content,settings}/page.tsx` |
| Format utils | `lib/utils/format.ts` |

## KPIs
- **Active clients** — count of `clients` where `status='active'`.
- **MRR** — `v_agency_mrr` view (admin only; hidden for writers).
- **In pipeline** — `content_projects` not `sent`/`archived`.
- **Pending approvals** — `approvals` where `decision='pending'`.
- **Avg authenticity** — mean of scored projects' `authenticity_score` (target ≥ 90).

## Widgets
- **PipelineBar** — distribution of projects across all 10 statuses, horizontal bars.
- **ClientOverview** — 8 most recent clients with health + status badges, linking to `/clients/[id]` (Phase 5).

## Decisions taken (per "use your recommendations")
1. **In-house UI primitives**, not ShadCN init — `Card`/`Badge`/`StatCard` use a ShadCN-compatible API so a later `shadcn add` is a drop-in swap. Avoids generator churn mid-build.
2. **Server-rendered data** via the RLS-scoped server client — no client-side fetching for the dashboard. Tenant isolation enforced by RLS, not query params. (TanStack Query reserved for interactive lists in later phases.)
3. **Revenue gated in the data layer**, not just UI — `getDashboardData` skips the MRR query entirely for non-admins (`mrr: null`), so a writer's payload never contains revenue. Defense in depth with RLS (revenue tables are admin-only anyway).
4. **Slim placeholders** for `/clients`, `/content`, `/settings`, plus a real lightweight `/revenue` — keeps the nav from 404ing; each marked with its owning phase.
5. **Aggregation in JS** (pipeline counts, avg authenticity) — fine at agency scale; promote to SQL views if a tenant ever has tens of thousands of projects.

## Verification checklist
- [ ] Owner/admin see MRR card; writer does not (and payload has no MRR).
- [ ] KPIs reflect seed data (2 active clients, MRR $2,250, 1 project in pipeline).
- [ ] Empty agency renders zero-states, no crash.
- [ ] Client-role user cannot reach `/dashboard` (redirected by `requireStaff`).
- [ ] Nav links resolve (no 404).

## Notes
- Charts are CSS bars (no chart lib dependency yet). Add a lib in Phase 11 if richer revenue trends are needed.
