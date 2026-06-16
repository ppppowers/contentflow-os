# Phase 14 — Revision Intelligence Engine

Learns a Client Preference Profile from revision history + approval comments and
feeds it back into every future content run — so the platform needs fewer edits
over time.

## What it analyzes

`learnPreferences` (Claude strong):
- `revisions` (scope + instructions) across the client's projects.
- `approvals` (stage/decision/comment).
- **Deterministic** approval turnaround: median of `(updated_at - created_at)` in
  days for approved/sent/scheduled projects (pure `medianDays`), stored as
  `approval_speed_days`.

## Profile (Claude output)

`preferenceProfileSchema` (strict): `summary`, `preferences[]`, `avoid[]`,
`commonRequests[]`, `toneAdjustments[]`.

## Storage / flow

`preference_profiles` (migration `0025`): client-scoped, latest = active. New
"Preferences" tab → "Learn preferences" (`POST /api/preferences`) → renders
profile + turnaround badge.

## Automatic feedback into generation

`assembleContext` loads the latest profile and `preferenceContextText` (pure)
formats Prefers/Avoid/Tone lines into `AssembledContext.preferenceText`, injected
into the shared preamble:

```
LEARNED CLIENT PREFERENCES (from past revisions — honor these to reduce edits):
Prefers: short paragraphs
Avoid: exclamation marks
Tone: warmer
```

Every agent on every run for that client now honors learned preferences — the
"improve future content automatically" requirement, enforced structurally.

## Verification

- Tests: `medianDays` (empty/odd/even), `preferenceContextText`, schema strict.
- Phase-14 files typecheck clean; total tsc errors unchanged at 11.

## Follow-ups

- A `decided_at` column on approvals would make turnaround exact (currently `updated_at` proxy).
