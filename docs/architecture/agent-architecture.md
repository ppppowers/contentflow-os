# Agent Architecture

**Rule: no single agent writes final content.** Every piece flows through all relevant agents in order. Output of each agent is Zod-validated structured JSON, persisted to `agent_outputs`, and handed to the next agent. Humanization and Compliance are hard gates.

## Orchestration model
- `lib/agents/registry.ts` — agent id → `{ model_tier, prompt, inputSchema, outputSchema, gate? }`.
- `lib/agents/orchestrator.ts` — owns the pipeline state machine; decides next agent from `content_projects.status`; enforces gates.
- `lib/agents/runner.ts` — single-agent executor: assemble context → call Claude → validate → persist run + output → return payload. Idempotent per `run_id`.
- `lib/agents/memory.ts` — builds each agent's context window from: active `brand_profile`, latest `research` output, prior `agent_outputs` for the project, relevant `intake_items`. Agents never get raw cross-tenant data.
- `lib/agents/authenticity.ts` — deterministic banned-phrase scan + structured score (feeds Human Editor + Compliance).

## Handoff contract
Each agent input = `{ project context, brand_profile, upstream outputs it needs }`. Each output = a typed payload. Persisted output is the **only** thing downstream agents read (no hidden state). Versioned via `agent_outputs.version` + `supersedes_id` so revisions create new versions, not overwrites.

## The 9 agents

| # | Agent | Model tier | Input | Output (persisted payload) |
|---|-------|-----------|-------|----------------------------|
| 1 | Account Manager | mid | intake_items, client, brand_profile | **Client Brief**: structured summary, detected missing info, clarification questions |
| 2 | Client Research | strong | client, website_url, brief, existing content | **Research Report**: brand voice analysis, products/services, audience, positioning |
| 3 | Content Strategist | strong | brief, research | **Content Blueprint**: newsletter angle, blog angle, social strategy, CTA, key messages |
| 4 | Newsletter Writer | strong | blueprint, brand_profile | **Newsletter Draft**: body, subject_lines[], preview_text |
| 5 | SEO/Blog | mid | blueprint, newsletter draft | **SEO Blog Package**: article, seo_title, meta_description, slug, keywords[] |
| 6 | Social Media | mid | blueprint, newsletter draft | **Social Package**: facebook, linkedin, instagram_caption, sms |
| 7 | Human Editor | strong | all drafts, brand_profile, banned_phrases | **Humanized Draft** + per-piece authenticity score, rewritten where AI-sounding |
| 8 | Compliance | mid | humanized drafts, brand_profile | **Quality Report**: readability, CTA quality, grammar, mobile readability, spam risk, voice consistency |
| 9 | Delivery | cheap | approved pieces | **Final Delivery Package**: newsletter + blog + social + client approval packet |

(Model tiers map to concrete Claude model ids in Phase 7 via the registry; "strong" for writing/strategy/judgment, "mid"/"cheap" for transforms and packaging.)

## Humanization gate (Agent 7) — critical
Target: content reads like a real employee/owner/director wrote it. **Authenticity Score 0–100; below 90 → mandatory rewrite, re-scored.** Loop bounded (max N rewrite passes, then flag for human).

Two-layer scoring:
1. **Deterministic scan** (`authenticity.ts`): flags banned phrases and AI tells —
   *unlock the power of, game-changing, leverage, transform, elevate, fast-paced world, revolutionary, cutting-edge, moreover, furthermore, in conclusion*, plus generic intros/conclusions, repetitive transitions, empty filler, corporate buzzwords. Each hit deducts.
2. **LLM judgment** (Agent 7 via Claude): rewrites flagged content in the client's voice, must NOT sound like ChatGPT/Claude/marketing automation; must sound like a knowledgeable employee / executive director / business owner / marketing coordinator / community leader.

Priority order enforced in prompt + scoring weights: **AUTHENTICITY > READABILITY > SEO > MARKETING.**

Final `authenticity_scores` row written per piece with `flagged_phrases`, `breakdown`, `passed`.

## Compliance gate (Agent 8)
Produces `Quality Report` checking: readability, CTA quality, grammar, mobile readability, spam risk, brand-voice consistency. A failing report blocks promotion to `internal_review` and routes back with specific fixes.

## Audit & memory
- **Audit:** every invocation → one `agent_runs` row (status, model, tokens, cost, timing, error). Append-only, queryable per project.
- **Memory:** durable, project-scoped — assembled from persisted outputs + brand profile each run. No reliance on conversational state; a run can be reconstructed from the DB. Brand profile is the long-term per-client memory; research report is the per-cycle memory.

## Failure & retry
- Validation failure (Claude output fails Zod) → run marked `failed`, automatic re-prompt up to retry limit, then surfaced to a human. No partial/invalid payload ever handed downstream.
- Each agent independently invokable (`/api/agents/[agent]`) for re-runs without redoing the whole pipeline.
