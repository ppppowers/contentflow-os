# Phase 19 — Red Team Department

A hostile, skeptical reviewer that attacks a project's deliverables before they
can pass QA.

## Review

`redTeamReview(projectId)` (Claude strong) reads the deliverables + the client's
recently covered topics (repetition check) and answers the five questions —
`isGeneric`, `isRepetitive`, `isUseful`, `subscribersWouldCare`, `soundsLikeAI` —
plus a `score`, a `verdict` (pass/fail), and specific `findings`
(`redTeamSchema`, strict). The function returns data; callers persist.

## Storage

`qa_reviews` (migration `0028`) — generic per-layer QA table. A standalone Red
Team review (`POST /api/redteam`) writes one row with `layer = 'red_team'` and its
own `run_id`. The same row shape is reused by the full QA run (Phase 20).

Surfaced on the project page via the QA controls + the QA layer list.

## Gate

Red Team is a required QA layer — the QA roll-up (Phase 20) cannot pass unless the
Red Team verdict is `pass`.

## Verification

- Tests: `redTeamSchema` accept / bad-verdict reject / strict reject.
