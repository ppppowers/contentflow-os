# Technical Architecture

## Runtime topology
```
Browser (Next.js client)
  │  TanStack Query (reads) / Server Actions (writes)
  ▼
Next.js on Vercel
  ├─ Server Components + Server Actions   → CRUD, RLS-scoped Supabase client
  ├─ Route Handlers (/api/agents, /api/pipeline) → agent orchestration (Claude API)
  └─ middleware.ts → session refresh + tenant/role resolution
  │
  ├──► Supabase Postgres (RLS)        — system of record
  ├──► Supabase Auth                  — sessions, JWT (role + agency_id claims)
  ├──► Supabase Storage               — intake uploads, exports (signed URLs)
  └──► Anthropic Claude API           — 9 agents, server-side only
```

## Request patterns

### Reads
Server Components fetch via RLS-scoped Supabase server client for initial render. Client interactivity hydrates through TanStack Query hooks in `lib/queries/` hitting the same scoped endpoints. Query keys namespaced by tenant + resource.

### Writes (CRUD)
Server Actions. Each action: `auth guard → Zod parse → RLS-scoped mutation → revalidate`. No service-role key in CRUD paths — RLS does the enforcement.

### Agent orchestration (long-running)
Route Handlers, not Server Actions (avoid action timeout limits, allow streaming/progress). Flow:
1. Client POSTs `/api/pipeline/run` (or `/advance`) with `project_id` + target stage.
2. Handler verifies caller role + tenant, loads project, checks status preconditions.
3. `orchestrator.ts` runs the next agent(s) via `runner.ts`:
   - assemble context (`memory.ts`) → call Claude (`claude/client.ts`) → Zod-validate output (`validation/agent-io.ts`) → persist `agent_runs` + `agent_outputs` → advance `content_projects.status`.
4. Failures: row marked `failed`, project status unchanged, error surfaced. Retries are explicit (idempotent per run id).

### Background / scheduled
Phase 7+: Supabase Cron (pg_cron) or Vercel Cron triggers a Route Handler for queued pipeline steps so large runs don't block the request. Phase 1 design keeps orchestration synchronous-per-step but each step is independently invokable → trivially movable to a queue.

## State machine (pipeline)
`content_projects.status` transitions are the only legal path. Orchestrator refuses out-of-order moves.
```
intake_received → research_complete → draft_generated → internal_review
   → client_review ⇄ revision_requested → approved → scheduled → sent → archived
```
- `internal_review` reached only after Human Editor (≥90) AND Compliance pass.
- `client_review → revision_requested` loops back into generation with revision instructions.
- Gates: Human Editor score < 90 blocks `draft_generated → internal_review`.

## Data validation strategy
Single Zod schema set in `lib/validation/`, imported by:
- React Hook Form (client form validation),
- Server Actions (re-validate server-side — never trust client),
- Agent I/O (validate Claude structured output before it's persisted or handed off).
Database types generated from Supabase (`types/database.types.ts`) keep DB ↔ TS in sync.

## Claude integration
`lib/claude/client.ts` wraps the Anthropic SDK:
- Model tier per agent (registry-driven): cheaper tier for transform/QA agents, stronger tier for writing/strategy agents.
- Structured output enforced via tool/JSON schema; result Zod-parsed.
- Token + cost captured into `agent_runs`.
- Server-only module (never imported by client bundles).

## Caching & performance
- TanStack Query client cache + Next.js route revalidation for dashboard reads.
- Agent outputs persisted (never re-run an agent to re-read a result).
- Dashboard MRR/KPI: computed via SQL views over `revenue_events` (Phase 11), not client aggregation.

## Environments
- `local` (Supabase CLI), `preview` (Vercel preview + Supabase branch), `production`.
- Migrations versioned in `supabase/migrations/`, applied via CI.

## Testing strategy (per phase)
- **Unit:** Zod schemas, role/permission checks, authenticity scorer, MRR math.
- **Integration:** server actions + RLS (a tenant cannot read another tenant's rows).
- **E2E (Playwright):** auth, client CRUD, intake submit, full pipeline run, approval loop.

## Observability (Phase 13)
Structured logs on every agent run; `agent_runs` + `audit_log` are the operational audit trail. Error tracking wired before deploy.
