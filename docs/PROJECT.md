# ContentFlow OS

AI-powered content agency operating system. Agencies and freelancers create, manage, approve, and deliver newsletters, blogs, social posts, and client comms at scale.

**Status:** Phase 1 — Project Architecture (awaiting approval before Phase 2).

## Product in one line
Client intake → multi-agent AI content pipeline → human-grade output → approval → delivery → revenue tracking.

## Core principle
**AUTHENTICITY > READABILITY > SEO > MARKETING.** No single agent writes final content. Every piece flows through a 9-agent pipeline with a humanization gate (Authenticity Score ≥ 90 required).

## Tech stack
| Layer | Choice |
|-------|--------|
| Frontend | Next.js (App Router), TypeScript, Tailwind, ShadCN UI |
| State (client) | TanStack Query |
| Validation | Zod (shared client + server) |
| Backend | Supabase (Postgres + Auth + Storage), Row Level Security |
| AI | Claude API (Anthropic) — model tier per agent |
| Deploy | Vercel + Supabase cloud |

## Locked architecture decisions
1. **Multi-tenant from day 1.** `agency_id` foreign key on every business row. RLS enforces tenant isolation. Internal use now = one agency row; white-label later = no schema migration.
2. **All 9 agents call Claude API server-side.** API keys never reach the browser. Structured output validated by Zod before handoff.
3. **Single Next.js app, monorepo.** Server Actions for mutations, Route Handlers for long-running agent orchestration.
4. **Pipeline is sequential with gates.** Status state machine drives progression. Humanization + Compliance are hard gates.

## Build phases (gated)
1. Project Architecture ← **YOU ARE HERE**
2. Supabase Database (schema, RLS, seed)
3. Authentication & Roles (owner/admin/writer/client)
4. Agency Dashboard (KPIs, revenue, clients)
5. Client Management
6. Monthly Intake System
7. Agent Framework (orchestration, memory, handoffs, audit)
8. Content Generation Engine
9. Humanization Engine
10. Approval System
11. Revenue Tracking
12. Export System (PDF/HTML/copy/archive)
13. QA & Security Audit
14. Deployment

Each phase: build → validate → document → test → STOP for approval.

## Phase 1 deliverables
- `docs/architecture/folder-structure.md`
- `docs/architecture/database-design.md`
- `docs/architecture/technical-architecture.md`
- `docs/architecture/agent-architecture.md`
- `docs/architecture/security-plan.md`
