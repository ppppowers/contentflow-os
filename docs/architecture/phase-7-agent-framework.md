# Phase 7 — Agent Framework (delivered)

The orchestration engine: 9-agent pipeline, Claude wiring, durable memory, handoffs, gates, and a full audit trail. Agent *prompts* are baseline here; Phases 8/9 deepen newsletter/blog/social writing and the humanization scorer.

## What shipped
| Area | Files |
|------|-------|
| Claude wrapper | `lib/claude/client.ts` (model tiers, structured output, token+cost) |
| Agent I/O schemas | `lib/validation/agent-io.ts` (Zod per agent + JSON Schema) |
| Prompts | `lib/agents/prompts.ts` (shared voice-law preamble + per-role) |
| Registry | `lib/agents/registry.ts` (sequence, deps, tiers, gates) |
| Memory | `lib/agents/memory.ts` (assemble context from DB) |
| Runner | `lib/agents/runner.ts` (single agent → run + output, validated) |
| Orchestrator | `lib/agents/orchestrator.ts` (state machine + gates + deliverables) |
| API | `app/api/pipeline/run/route.ts`, `app/api/agents/[agent]/route.ts` |
| Spawn | `lib/actions/content.ts` (`createProjectFromSubmission`) + intake button |
| UI | `content/` list + `content/[projectId]` pipeline view + `RunControls` |

## Decisions taken (delegated)
1. **Claude via `@anthropic-ai/sdk`, structured output** (`output_config.format` + JSON Schema). Model tiers: **strong = `claude-opus-4-8`** (writing/strategy/judgment: research, strategist, newsletter, human_editor), **mid = `claude-sonnet-4-6`** (account_manager, seo_blog, social, compliance), **cheap = `claude-haiku-4-5`** (delivery). Confirmed against the Claude API reference.
2. **Zod is the handoff gate.** Every agent output is Zod-validated before it's persisted or handed downstream — invalid model output never propagates (1 automatic retry, then the run is marked `failed`).
3. **Memory is reconstructed from the DB each run** — active brand profile + intake items + latest upstream `agent_outputs`. No conversational state; a run is fully reproducible from rows.
4. **Outputs are versioned, append-only.** Re-running an agent creates a new `agent_outputs` version; downstream reads the latest.
5. **Gates enforced in the orchestrator.** Human Editor returns an Authenticity Score → written to `content_projects.authenticity_score` + `authenticity_scores`; **< 90 stops the pipeline and sets `revision_requested`.** Compliance `passed=false` does the same. Both passing materializes `content_pieces` and advances to `internal_review`.
6. **Route Handlers, not Server Actions**, for runs (`maxDuration=300`) — agent calls take seconds–minutes. Each agent is independently invokable for targeted re-runs.

## Pipeline + status mapping
```
account_manager → research(→research_complete) → strategist → newsletter
→ seo_blog → social(→draft_generated) → human_editor[gate ≥90]
→ compliance[gate]( → internal_review + materialize pieces) → delivery
```
`runPipeline` skips agents that already have output, so it resumes where it left off.

## Audit
- Every invocation → one `agent_runs` row: status, model, input/output tokens, USD cost, timing, error. Append-only; shown in the project's pipeline view with total spend.
- The project page also surfaces every agent's latest structured output (collapsible) for inspection.

## Security
- Claude + service modules are **server-only**; `ANTHROPIC_API_KEY` never reaches the client.
- API routes re-check staff role + RLS-scope the project before running.
- Agent prompts treat client/intake text as **data, not instructions**; outputs are schema-constrained (no arbitrary actions).

## Not runnable here
No `node_modules`, no Supabase, no `ANTHROPIC_API_KEY`. To exercise: `npm install`, set the key, `supabase db reset`, create a client + brand profile + reviewed intake → "Create content project" → "Run pipeline".

## Verification checklist
- [ ] `Run pipeline` executes agents in order; `agent_runs` + `agent_outputs` populate.
- [ ] Invalid/garbled model output marks the run `failed`, doesn't advance.
- [ ] Authenticity < 90 → pipeline stops at `human_editor`, status `revision_requested`.
- [ ] Both gates pass → `content_pieces` created, status `internal_review`.
- [ ] Total cost on the project page matches summed run costs.
- [ ] A second agency can't run or read another agency's project (RLS + route check).

## Hooks for later phases
- Phase 8 fleshes out newsletter/blog/social prompts + per-piece editing.
- Phase 9 deepens the Human Editor (deterministic banned-phrase scan in `authenticity.ts` feeding the LLM score) + bounded rewrite loop.
- Phase 10 consumes `content_pieces` + `approvals` for internal/client review.
