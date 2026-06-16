# Phase 9 — Humanization Engine (delivered)

The two-layer authenticity gate with a bounded rewrite loop. Deterministic scanner + LLM judgment must BOTH clear 90; failing drafts are rewritten with the flagged phrases fed back, up to 3 passes, then flagged for a human.

## What shipped
| Area | Files |
|------|-------|
| Deterministic scanner | `lib/agents/authenticity.ts` (pure, testable) |
| Rewrite-feedback in runner | `lib/agents/runner.ts` (optional `feedback` arg) |
| Gate + rewrite loop | `lib/agents/orchestrator.ts` (`runHumanizationGate`) |
| Score surfacing | `lib/data/content.ts` + project page Authenticity report |

## How the gate works
1. **Human Editor (LLM)** rewrites the drafts and returns an `authenticityScore`.
2. **Deterministic scanner** (`scanText` / `scanEditorOutput`) scans the humanized corpus for: brand-banned phrases + default banned list (weight 7), AI tells (4), repetitive transitions (3), filler (2), and generic intro/conclusion patterns (8). Each phrase deducts `weight × min(count, 3)` from 100.
3. **Final score = `min(LLM, scanner)`** — the stricter wins, so a high LLM self-score can't rescue copy that still contains banned phrases.
4. **< 90 → rewrite pass.** `buildRewriteFeedback` lists every flagged phrase and is appended to the Human Editor's next prompt: "remove or rewrite EVERY one." Loop up to **3 passes**.
5. **Still < 90 after 3 → `revision_requested`**, flagged for human review. **≥ 90 → proceeds to Compliance.**

Every pass writes an `authenticity_scores` row: `score`, `flagged_phrases`, `breakdown` (llm/deterministic/deductions/pass), `passed`.

## Decisions taken (delegated)
1. **Stricter-of-two scoring** (`min`), not an average — authenticity is a floor, not a tradeoff. A real banned phrase tanks the score regardless of LLM optimism.
2. **Deterministic layer is pure** (no I/O) → unit-testable and cheap; runs on every pass without an extra model call.
3. **Brand banned phrases are merged** with the platform defaults at scan time, so per-client prohibitions (set in Phase 5) are enforced here.
4. **Bounded loop (3 passes)** prevents infinite/expensive rewrite cycles; exhaustion escalates to a human rather than shipping sub-90 copy.
5. **Report is visible** on the project page — score breakdown + the exact flagged phrases — so editors see why something failed.

## Verification checklist
- [ ] Seed copy containing "leverage" / "in today's fast-paced world" → scanner flags them, final score drops, rewrite pass triggers.
- [ ] After rewrite removes the phrases → scanner score rises; gate passes at ≥90.
- [ ] LLM score 95 but a banned phrase present → final = scanner score < 95 (min wins).
- [ ] 3 failed passes → status `revision_requested`, no Compliance run.
- [ ] `authenticity_scores` rows accumulate one per pass with correct breakdown.
- [ ] Project page shows flagged phrases with kind + count.

## Notes
- `scanText` is the natural unit-test target for Phase 13 (weights, counts, generic-pattern regexes).
- The scanner word list is intentionally conservative; expand `AI_TELLS`/`FILLER` as real outputs reveal new tells.
