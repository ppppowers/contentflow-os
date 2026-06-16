# Phase 10 — Story Mining Engine

A Story Mining Agent reads everything a client has given the agency and surfaces
distinct, reusable STORIES — customer, volunteer, donor, employee, project-success
— into a tagged, categorized, full-text-searchable Story Bank.

## Mining over existing durable sources

No new capture surface — the agent synthesizes from data already in the system:

```
mineStories(clientId)                          (lib/stories/mine.ts)
  gatherSources():
    ├─ intake_items   (all submissions)
    ├─ meeting_intelligence.payload.extracted (stories/wins/promos/opportunities)
    └─ brain_entries  (active)
  → budget 30k chars
  → existing story titles passed to the prompt ("don't repeat") + normalizeTitle dedup
  → callStructured(tier: strong, schema: minedStoriesJsonSchema)
  → insert only fresh stories
```

The model is told to merge duplicates, ground every story in the material, and
skip non-stories. Inserts are de-duped by `normalizeTitle` against the bank, so
re-mining is safe and idempotent-ish.

## Story Bank schema

`stories` (migration `0021`): `category` enum, `title/summary/detail`, `tags[]`,
`status` (lead → ready → used), `source` (mined|manual), generated `search`
tsvector. Indexes: GIN `search`, GIN `tags`, `(client_id, category)`. RLS
staff-only.

## Searchable + categorized + tagged

`listStories(clientId, {query, category})` — Postgres `websearch_to_tsquery` over
the generated vector + category filter. The Stories tab has a search box, a
category dropdown, and clickable tag chips (tag → filtered search).

## Lifecycle + pipeline integration

- Status workflow: **lead → ready → used** (one-click advance).
- Manual add (curate a story by hand).
- **Send to intake**: pushes a story into this month's intake as the matching
  intake type (customer→customer_story, donor→donor_story, employee→team_update,
  project_success→project_complete, volunteer→volunteer_story) and marks it `used`.
  Stories become content, closing the loop with the pipeline.

## Verification

- 68/68 unit tests pass (6 new: normalizeTitle, mined-batch schema accept/reject/strict, story form tags + title).
- Phase-10 files typecheck clean; total project tsc errors unchanged at 11.

## Follow-ups

- Near-duplicate detection currently exact-on-normalized-title; could reuse the Phase 3 lexical `similarity()` to merge close variants.
- Stories could feed the agent context (a "available stories" hint) so the strategist proposes story-driven angles — deferred to the strategy phase.
