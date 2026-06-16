# Phase 1 — Command Center Foundation

The Command Center is the single entry point for all orchestrated work in
ContentFlow OS. It does **not** replace the existing agent layer
(`lib/agents/*`) — it wraps and formalizes it, and adds the three capabilities
the V2 spec required that did not yet exist: a **routing framework**, **task
management**, and **unified audit logging**.

## Responsibilities → implementation

| Responsibility      | Implementation                                                        |
| ------------------- | --------------------------------------------------------------------- |
| Agent orchestration | `lib/agents/orchestrator.ts` (`runPipeline`) + `runner.ts` (`runAgent`) — reused |
| Context assembly    | `lib/agents/memory.ts` (`assembleContext`) — reused                   |
| Workflow routing    | `lib/command-center/router.ts` + `workflows.ts` — **new**             |
| Audit logging       | `lib/command-center/audit.ts` → `audit_log` table — **new wiring**    |
| Task management     | `lib/command-center/tasks.ts` → `cc_tasks` table — **new**            |

## Architecture diagram

```
                         POST /api/command-center
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │   Command Center (service.ts) │
                    │   dispatch(request, ctx)      │
                    └──────────────────────────────┘
                                   │
          ┌────────────────────────┼─────────────────────────┐
          ▼                        ▼                          ▼
   router.ts                  tasks.ts                    audit.ts
  routeRequest()            createTask()                 logAudit()
  ├─ workflow → steps[]     startTask()                  → audit_log
  └─ agent                  finishTask()                 (cc.dispatch,
          │                  → cc_tasks                    cc.*.complete)
          ▼
   ┌─────────────────────────────────────────────────────┐
   │  Execution (existing agent layer, unchanged logic)   │
   │  workflow → orchestrator.runPipeline(steps, upTo)    │
   │  agent    → runner.runAgent(agent)                   │
   │            ├─ memory.assembleContext (durable)       │
   │            ├─ claude.callStructured (Claude-only)    │
   │            ├─ Zod gate → agent_outputs (versioned)   │
   │            └─ agent_runs (tokens / cost / status)    │
   │  gates: human_editor (≥90) · compliance              │
   └─────────────────────────────────────────────────────┘
```

## Folder structure (new + touched)

```
lib/command-center/
  index.ts        — public surface (re-exports)
  service.ts      — dispatch(): route → task → execute → audit
  router.ts       — routeRequest(): pure request → validated RoutePlan
  workflows.ts    — WORKFLOWS registry (named subsets of SEQUENCE)
  tasks.ts        — cc_tasks lifecycle (create/start/finish/list)
  audit.ts        — logAudit() → audit_log (best-effort)
lib/validation/
  command-center.ts — dispatchRequestSchema (Zod)
app/api/command-center/
  route.ts        — staff-only POST entry point
supabase/migrations/
  0013_command_center.sql — cc_tasks table + enums + RLS
lib/agents/orchestrator.ts — runPipeline() gains optional `steps` (back-compat)
tests/unit/command-center.test.ts — router unit tests
```

## Agent registry

Canonical registry is unchanged: `lib/agents/registry.ts` defines `SEQUENCE`
(9 agents) and `REGISTRY` (per-agent tier / dependsOn / gate / advancesTo).
Phase 1 layers a **workflow registry** on top:

| Workflow                 | Steps                                                | Use                          |
| ------------------------ | ---------------------------------------------------- | ---------------------------- |
| `full_content_pipeline`  | all 9 (= SEQUENCE)                                   | end-to-end run               |
| `research_brief`         | account_manager → research → strategist              | brief before drafting        |
| `draft_generation`       | newsletter → seo_blog → social                       | drafts from existing strategy|
| `final_review`           | human_editor → compliance → delivery                 | humanize + gate + deliver    |

Workflows are strict subsets of `SEQUENCE`; gates apply by agent identity when
present in the slice.

## Execution pipeline

1. `POST /api/command-center` — auth + `isStaff` + Zod `dispatchRequestSchema` + RLS project check.
2. `dispatch()` calls `routeRequest()` → `RoutePlan` (rejects unknown target / missing project).
3. `createTask()` inserts `cc_tasks` row (queued) → `startTask()` (running); `logAudit('cc.dispatch')`.
4. Execute:
   - workflow → `runPipeline(projectId, ctx, { steps, upTo })` (resumes from first agent without output, honors gates).
   - agent → `runAgent(projectId, agent, ctx)` (new output version).
5. `finishTask()` records succeeded/failed + result summary; `logAudit('cc.workflow.complete' | 'cc.agent.complete')`.
6. Response returns `{ ok, taskId, kind, result }`.

Claude-only: all model calls go through `lib/claude/client.ts` (Opus/Sonnet/Haiku tiers). No other providers.

## Notes / follow-ups

- Existing routes `/api/pipeline/run` and `/api/agents/[agent]` still work unchanged (call orchestrator/runner directly). They can be migrated to dispatch through the Command Center in a later phase; left intact now to avoid regression.
- `cc_tasks` is a record/telemetry layer, not yet an async queue worker — dispatch runs inline within the request (maxDuration 300). A background worker is a future phase if runs exceed the limit.
- Pre-existing typecheck errors in `lib/supabase/*` and `content/[projectId]/export/page.tsx` are unrelated to Phase 1 (untouched files; implicit-any in supabase cookie handlers). Flagged for a later cleanup.
