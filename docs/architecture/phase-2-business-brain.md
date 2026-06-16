# Phase 2 — Business Brain Foundation

The Business Brain is the permanent, structured store of client knowledge. It is
**consulted by every content run before writing** — wired into the agent context
layer, not bolted on at the dashboard.

## Scope decision — complements brand_profiles, does not duplicate

The existing `brand_profiles` table already owns the client's **voice**:
`voice_summary`, `tone_descriptors`, `audience`, `products_services`,
`banned_phrases`, `required_disclaimers`, `reading_level`. The Brain owns the
durable **facts** the agency accumulates that voice doesn't cover:

| Spec item        | Lives in                                                   |
| ---------------- | ---------------------------------------------------------- |
| Brand voice      | `brand_profiles` (unchanged) — surfaced in prompt preamble |
| Audience         | `brand_profiles.audience` + Brain `audience_insight`       |
| Services         | Brain `service`                                            |
| Products         | Brain `product`                                            |
| Company history  | Brain `company_history`                                    |
| Promotions       | Brain `promotion`                                          |
| Events           | Brain `event`                                              |
| CTA preferences  | Brain `cta_preference`                                     |
| Past content     | existing `content_projects` / `content_pieces`             |
| Key facts        | Brain `key_fact`                                            |

One flexible typed table (`brain_entries`) instead of eight tables — later phases
add categories without new migrations.

## Brain schema

`brain_entries` (migration `0014_business_brain.sql`):

| column      | type            | note                                            |
| ----------- | --------------- | ----------------------------------------------- |
| id          | uuid pk         |                                                 |
| agency_id   | uuid fk         | tenant                                          |
| client_id   | uuid fk         |                                                 |
| category    | brain_category  | enum (8 categories)                             |
| title       | text            | the fact headline                               |
| body        | text            | concrete detail (dates, numbers, offers)        |
| data        | jsonb           | category-specific structure (e.g. promo dates)  |
| priority    | int             | higher = surfaced first in context              |
| source      | text            | manual \| website \| intake \| voice_note       |
| is_active   | bool            | inactive entries are excluded from generation   |
| created_by  | uuid fk         |                                                 |
| created_at/updated_at | timestamptz | updated_at trigger                          |

Indexes: partial `(client_id, category) where is_active`, `(agency_id)`.
RLS: `brain_entries_staff_all` — tenant-scoped, staff-only (mirrors clients).

## Retrieval architecture

```
content run → orchestrator.runAgent
                 │
                 ▼
        memory.assembleContext(projectId)
                 │  fetches client, brand, intake, upstream …
                 ├─ getBrainContext(clientId)            (lib/brain/retrieval.ts)
                 │     getBrainEntries  → active rows, priority desc
                 │     brainContextText → grouped, labeled markdown block  [PURE]
                 ▼
        AssembledContext.brainText
                 │
                 ▼
        prompts.buildSystemPrompt → preamble injects:
        "BUSINESS BRAIN — permanent client knowledge. Consult and ground every
         claim in this BEFORE writing."
                 │
                 ▼
        EVERY agent (account_manager … delivery) sees the Brain.
```

`brainContextText` is pure (entries → string) so it is unit-tested without I/O.
Empty Brain → empty string → preamble omits the section.

## Brain management dashboard

- Route: `app/(agency)/clients/[clientId]/brain/page.tsx` (new "Brain" tab).
- Add: `components/clients/BrainEntryForm.tsx` (category select, title, details, priority).
- List: grouped by category, with Activate/Deactivate (soft toggle) and Delete.
- Server actions: `lib/actions/brain.ts` — `addBrainEntry`, `setBrainEntryActive`, `deleteBrainEntry`.

## Requirement satisfied

"All future content generation must consult Business Brain first" — enforced
structurally: the Brain is assembled inside `assembleContext` and injected into
the shared preamble of every agent, so no agent can run without it. Adding a new
agent in a later phase inherits Brain consultation automatically.

## Follow-ups

- `data` jsonb is populated by future phases (website/voice-note ingestion); the manual dashboard currently sets title/body/priority only.
- Brand voice could later move fully into the Brain, but is left in `brand_profiles` now to avoid disturbing the humanization gate, which reads `banned_phrases` from there.
