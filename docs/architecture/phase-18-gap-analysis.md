# Phase 18 — Content Gap Analysis Engine

Analyzes a client's existing content to surface what's missing, untapped, and
overused — a planning input alongside the Strategy Engine.

## Flow

`analyzeGaps(clientId)` (Claude strong) gathers the client's content history
(`getContentHistory` — project titles + strategist angles) and Business Brain
(services/knowledge), then produces `gapAnalysisSchema` (strict): `summary`,
`missingTopics[]`, `untappedServices[]`, `overusedContent[]`, `recommendations[]`.

Stored in `gap_analyses` (migration `0027`, client-scoped, latest = active),
surfaced on a new **Gaps** client tab via `POST /api/gaps`.

## Verification

- Tests: `gapAnalysisSchema` accept + strict reject.
- Files typecheck clean; total tsc errors unchanged at 11.
