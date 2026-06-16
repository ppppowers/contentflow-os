# Phase 21 — Output Quality Scorecard

Scores a project's deliverables across 8 dimensions → an overall score. Target 95+;
below that flags for revision.

## Eight dimensions

| Dimension          | Source                                              |
| ------------------ | --------------------------------------------------- |
| Business Value     | LLM judge                                           |
| Human Authenticity | latest `authenticity_scores` (else `scanText`)      |
| Specificity        | `evidenceScore` avg (Phase 17, deterministic)       |
| Brand Voice        | LLM judge                                           |
| Readability        | `readabilityScore` (Flesch, deterministic)          |
| Engagement         | LLM judge                                           |
| Evidence           | LLM judge (are claims backed?)                      |
| CTA Quality        | LLM judge                                           |

Deterministic dims come from real metrics; the five LLM dims are one structured
call. `composeOverall` averages all 8; passes at `SCORECARD_TARGET = 95`.

## Storage / UI

`scorecards` (migration `0029`, project-scoped, latest = active). Project page
**Output quality scorecard** card: per-dimension grid (green ≥95 / amber ≥80 /
red), overall badge, and a "revision required" note below 95.

## Pure logic (tested)

`readabilityScore` (Flesch Reading Ease, vowel-group syllable approx, clamped
0-100) and `composeOverall` (average + 95 gate).
