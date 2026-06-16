# Phase 7 — Client Interview Agent

A dedicated agent that improves INPUT quality before the content pipeline ever
runs. It interrogates the month's intake, extracts concrete opportunities, flags
gaps, and generates dynamic follow-up questions — so the agency never relies on
thin, open-ended submissions.

## Why it's separate from the content pipeline

The 9-agent content pipeline (`lib/agents/*`) is **project-scoped** — it needs a
`content_project`. The interview happens earlier, at intake time, on a
**submission** that may not have a project yet. So the Interview Agent is its own
submission-scoped service that calls Claude directly via `callStructured`, and
persists to its own table. It complements the in-pipeline `account_manager`
(which does a lightweight brief) by doing the deep upstream interrogation first.

## Schema

`intelligence_briefs` (migration `0018_intelligence_briefs.sql`):
submission-scoped, latest row = active brief. Columns: `summary`,
`readiness_score`, `payload` (full structured brief jsonb), provenance.
RLS staff-only, tenant-scoped.

## Monthly Intelligence Brief (Claude output)

`intelligenceBriefSchema` (strict, structured output):

```
summary            2-3 sentences on the month's content center
readinessScore     0-100 — is the input rich enough for excellent content?
extracted          { stories, promotions, events, customerWins, teamAchievements }
                   each item = { title, detail }, only if genuinely supported
gaps               what's missing or too thin
followUpQuestions  [{ question, why }] — specific, dynamic, gap-targeted
```

The agent is instructed to extract only what the intake supports (no invention)
and to ask about the actual gaps, not generic prompts.

## Flow

```
Intake submission page → "Generate Intelligence Brief"
   → POST /api/interview {submissionId}   (route handler, maxDuration 300)
        generateBrief()                    (lib/interview/agent.ts)
          ├─ load submission + client + intake items + file names
          ├─ getBrainContext(clientId)  (don't re-ask known facts)
          ├─ callStructured(tier: strong, schema: briefJsonSchema)
          └─ persist intelligence_briefs row
   → page re-renders: readiness badge, summary, follow-up questions,
     gaps, and the five extracted categories
```

The brain context makes follow-ups smarter — the agent won't ask for facts the
Business Brain already holds.

## Verification

- 49/49 unit tests pass (5 new: brief schema accept/reject/strict, `countExtracted`).
- Phase-7 files typecheck clean; total project tsc errors unchanged at 11.

## Follow-ups

- Follow-up questions could be pushed to the client (email/portal) and their answers captured back as intake items — pairs with Phase 6 capture + a future email phase.
- The latest brief could be injected into `account_manager`/`research` context when a project is later created from the submission (deferred — account_manager already reads raw intake).
