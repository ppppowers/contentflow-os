# Phase 6 — Content Harvesting Dashboard

A Content Collection Center built for friction-zero capture. Pick a client, tap a
Quick Action Card, jot a sentence — it lands in this month's intake automatically.

## Design — capture layer over the existing intake store

Phase 6 does **not** add a new content table. The monthly intake system
(`intake_submissions` / `intake_items` / `intake_files`) is already the durable,
RLS-scoped, agent-consumed store. Harvesting is a low-friction *capture surface*
that writes into it:

- The user never thinks about periods or submissions.
- `captureContent` calls `ensureSubmission(client, currentPeriod())` then inserts
  an `intake_items` row — submission is created on the fly if missing.
- Media reuses the existing `intake` storage bucket + `recordIntakeFile`.

Everything harvested flows straight into research/strategy with no extra plumbing.

## Quick Action Cards

`lib/harvest/cards.ts` — 8 cards (the 7 spec cards + a generic Quick Update),
each preselecting an intake type and carrying a guiding prompt:

| Card                | Intake type        |
| ------------------- | ------------------ |
| Customer Story      | customer_story     |
| Project Complete    | project_complete * |
| New Employee        | team_update *      |
| Upcoming Event      | event              |
| Promotion           | promotion          |
| Volunteer Spotlight | volunteer_story    |
| Donor Story         | donor_story *      |
| Quick Update        | business_update    |

`*` = new enum values added in migration `0017` so captures stay precisely typed.

## Schema change

`0017_harvest_types.sql` — `ALTER TYPE intake_type ADD VALUE` for
`project_complete`, `team_update`, `donor_story` (add-only, not used in the same
migration → safe in the migration transaction). `lib/validation/intake.ts`
`INTAKE_TYPES` + labels updated to match.

## UX flow

```
/collect (new "Collect" nav link, staff)
  ├─ client chips (pick client)
  ├─ QuickCapture (client component)
  │    card grid → click a card → inline box (type preset+editable, title, body)
  │    → captureContent(clientId) → ensureSubmission + insert intake_item
  ├─ HarvestMedia (client component)
  │    photos / videos / voice notes → ensureCurrentSubmission → upload to
  │    intake bucket → recordIntakeFile   (voice transcription is Phase 9)
  └─ Recent captures feed (getRecentCaptures)
```

One click to start, two fields to finish, no navigation between steps.

## Verification

- 44/44 unit tests pass (4 new: card coverage, valid-type mapping, unique keys,
  new enum values present).
- Phase-6 files typecheck clean; total project tsc errors unchanged at 11.

## Follow-ups

- Voice notes are stored now; transcription + extraction is Phase 9 (Voice Intelligence).
- A client-facing capture link (so clients self-serve without staff) can reuse `captureContent` behind a client-role path — deferred.
- Per-card structured metadata (e.g. promo dates) could populate `intake_items.metadata`; currently free-text body.
