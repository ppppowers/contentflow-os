# Phase 4 — Agency Knowledge Brain

Agency-wide intelligence: proven elements harvested from ANY client's winning
work, reused to lift EVERY future project. This is where the platform compounds
across the whole book of business, not just one client.

## Three brains — kept distinct

| Layer                  | Scope        | Phase | Purpose                                  |
| ---------------------- | ------------ | ----- | ---------------------------------------- |
| Business Brain         | per-client   | 2     | permanent client facts (history, promos) |
| Client Memory          | per-client   | 3     | past topics + similarity warnings        |
| **Agency Brain**       | **per-agency (cross-client)** | **4** | **proven subject lines / CTAs / angles / newsletters / prompts** |

The Agency Brain is the only cross-client store. RLS keeps it staff-only — clients
never see another client's patterns.

## Schema

`agency_brain_entries` (migration `0015_agency_brain.sql`):

| column            | type                  | note                                   |
| ----------------- | --------------------- | -------------------------------------- |
| category          | agency_brain_category | subject_line/newsletter/campaign/prompt/cta |
| content           | text                  | the proven element                     |
| source_client_id  | uuid (set null)       | provenance only — dashboard, never exposed cross-client |
| source_project_id | uuid (set null)       | provenance + harvest-once guard        |
| authenticity_score| int                   | the "this worked" signal at harvest    |
| times_used        | int                   | reuse counter (future ranking)         |
| tags / is_active  |                       |                                        |

Indexes: `(agency_id, category) where is_active`; unique
`(source_project_id, category, md5(content))` to block re-harvest dupes.
RLS: `agency_brain_staff_all` — tenant-scoped, staff-only.

## Learning engine

`lib/agency-brain/learn.ts` → `harvestProject(projectId, supabase, ctx)`:

- Harvest-once per project (guard query + unique index).
- Pulls latest `strategist` + `newsletter` outputs and the project authenticity score.
- Emits entries: each subject line → `subject_line`, newsletter body → `newsletter`,
  strategist `cta` → `cta`, strategist `newsletterAngle` → `campaign`.
- Accepts the supabase client as a param so it runs under the **service client** on a
  client-role approval (clients can't write `agency_brain` under RLS) or the normal
  client on a staff manual promote.

**Trigger points:**
- Auto: `clientDecision` approved branch (`lib/actions/approvals.ts`) — strongest
  "this worked" signal available until Phase 15 wires real open/click data.
- Manual: "Promote to Agency Brain" button on approved projects + hand-curated
  entries via the dashboard (`addAgencyBrainEntry`).

## Retrieval + feedback into generation

```
assembleContext
   └─ getAgencyPatternsText()              (lib/agency-brain/retrieval.ts)
        getBestPatterns("subject_line", 5)  ─┐ ordered by authenticity, then usage
        getBestPatterns("cta", 5)           ─┘
        agencyPatternsText(...)  → exemplar block   [PURE]
   → AssembledContext.agencyPatterns
        │
        ▼
   prompts preamble injects:
   "PROVEN AGENCY PATTERNS (adapt the SHAPE to THIS client's voice; never copy
    another client's specific facts): …"
```

Anonymized SHAPES, with an explicit no-copy instruction — proven structure
transfers, client facts do not.

## Analytics dashboard

`/agency-brain` (new staff nav link):
- Per-category stat cards (count + top score) via pure `summarizeStats`.
- Entries grouped by category with score / usage badges, activate/deactivate, delete.
- Manual add form.

## Verification

- 35/35 unit tests pass (5 new: `agencyPatternsText`, `summarizeStats`).
- Phase-4 files typecheck clean; total project tsc errors unchanged at 11 (pre-existing).

## Follow-ups

- `times_used` increment when an exemplar is actually adopted (needs attribution; deferred).
- Real performance signal (open/click) replaces authenticity-as-proxy in Phase 15.
- "Best prompts" category is manual-curation only for now (auto prompt-mining deferred).
