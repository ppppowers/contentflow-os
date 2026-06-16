# Phase 20 — Quality Assurance Department

A multi-layer QA run that produces one Quality Report per project, combining
deterministic signals with LLM judgment and the Red Team.

## Seven layers, one run

`runQA(projectId, ctx, runId)` writes a `qa_reviews` row per layer under a shared
`run_id`, then a `final` roll-up row:

| Layer          | Source                                                        |
| -------------- | ------------------------------------------------------------- |
| humanization   | latest `authenticity_scores` (deterministic, ≥95 from P16)    |
| compliance     | latest `compliance` agent output `.passed` (deterministic)    |
| red_team       | `redTeamReview` (Phase 19)                                     |
| strategy       | LLM judge (`qaJudgeSchema`)                                    |
| writing        | LLM judge                                                     |
| brand_voice    | LLM judge                                                     |
| final          | `rollupQA` — avg score; passes only if EVERY layer passed AND score ≥ 80 |

Deterministic layers come from real persisted data (not re-judged); only
strategy/writing/brand-voice are LLM-scored, in a single structured call. The
`final` row records which layers failed.

## Storage / UI

`qa_reviews` (migration `0028`, shared with Phase 19). `POST /api/qa` runs it;
the project page **Quality assurance** card shows the latest run's layers with
pass/fail + score badges and the rule: *content cannot ship until Red Team and
every QA layer pass.*

## Pure logic

`rollupQA` (avg + all-pass) is unit-tested; `QA_LAYERS` names the seven layers.

## Verification

- Tests: `qaJudgeSchema` required-layer enforcement, `rollupQA` avg/all-pass/empty,
  `QA_LAYERS` ordering. 111/111 total pass; total tsc errors unchanged at 11.

## Follow-ups

- A hard gate wiring QA pass into the approval/delivery transition (currently QA is
  run + displayed; enforcement is procedural) — candidate for Phase 23 hardening.
