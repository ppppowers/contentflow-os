# Phase 17 — Content Evidence System

A deterministic Evidence Strength Score (0-100) that rewards concrete specifics
over vague generalities, encouraging writers to ground content in real detail.

## Scoring (pure)

`lib/evidence/score.ts` — `evidenceScore(text)` counts four signals:
- numbers / currency / percentages (`countNumbers`)
- dates: months, weekdays, years (`countDates`)
- quote pairs (`countQuotes`)
- mid-sentence proper nouns, capped (`countProperNouns`)

Weighted (`numbers×10 + dates×10 + quotes×14 + properNouns×4`, clamped 0-100) and
returns per-category suggestions when a signal is absent ("Add concrete numbers…",
"Include a real quote…"). Pure → unit-tested (vague < 30, specific > 60, monotonic).

## Surfacing

The content project page shows an **Evidence strength** card: one score per
deliverable (green ≥60 / amber ≥30 / red <30) with the top suggestion. The same
scorer is available as a deterministic input to the QA Department (Phase 20).

No schema change — computed on demand from `content_pieces.body`.
