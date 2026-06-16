# Phase 16 — Humanization Department

Elevates the existing Human Editor + authenticity gate (built in Phase 9) into a
stricter Humanization Department.

## Changes

- **Threshold 90 → 95** (`AUTHENTICITY_THRESHOLD` in `lib/agents/registry.ts`).
  The bounded rewrite loop now rewrites until the final score (stricter of LLM
  judgment and deterministic scan) clears 95, else flags for human review.
- **Expanded deterministic scanner** (`lib/agents/authenticity.ts`): more AI
  clichés (game-changer, supercharge, unlock, dive into, the power of, …), more
  predictable transitions (in addition, last but not least, to sum up, …), more
  filler, and more generic-advice/opening patterns (whether you're a…, in this
  blog…, without further ado, …).
- Human Editor ROLE prompt updated to the 95 bar + "generic advice / predictable
  transitions" explicitly.

No schema change — reuses `authenticity_scores`. The gate, rewrite loop, and
LLM∧deterministic blend are unchanged in shape; only the bar and tell-coverage moved.

## Verification

- Tests: threshold = 95; new tells flagged; generic openings flagged; clean
  specific copy still scores 100. 111/111 total pass.
