# Phase 8 — Content Generation Engine (delivered)

Deepens the writer agents to craft level and adds human-in-the-loop per-piece editing + single-agent regeneration. Builds directly on the Phase 7 framework — no schema or pipeline changes.

## What shipped
| Area | Files |
|------|-------|
| Craft-level prompts | `lib/agents/prompts.ts` (strategist, newsletter, seo_blog, social rewritten) |
| Piece edit validation | `lib/validation/content.ts` |
| Piece edit action | `lib/actions/content.ts` (`updatePiece`) |
| Editing UI | `components/content/PieceEditor.tsx` (per-channel fields + copy) |
| Regenerate UI | `components/content/RegenerateButton.tsx` |
| Project page | editable deliverables + per-agent regenerate in the timeline |

## Writer prompt upgrades
Each writer now gets explicit, channel-native direction (length, structure, what to open with, what to avoid) instead of a one-liner:
- **Strategist** — angles must reference real intake names/numbers/dates; CTA tied to a real item, not "learn more".
- **Newsletter** — open on a specific moment, 200–400 words, 3–5 tight subject lines (<55 chars), complementary preview text.
- **SEO/Blog** — 500–900 words scannable, `seoTitle` ≤60 / `metaDescription` ≤155, realistic head+long-tail keywords, no stuffing.
- **Social** — platform-native rules per channel (FB warmth, LinkedIn insight-first, IG hook+hashtags, SMS ≤160 + `[LINK]`).
All still inherit the shared voice-law preamble (banned phrases, AUTHENTICITY > READABILITY > SEO > MARKETING).

## Human-in-the-loop (decisions taken)
1. **Per-piece manual editing.** `content_pieces` are editable in the UI — body always, plus channel-aware metadata (newsletter: subject lines + preview; blog: SEO title/meta/slug/keywords). Saving sets `status='edited'`. This is the "no single agent writes final content" principle extended to the human: AI drafts, a person finalizes.
2. **Single-agent regenerate.** Any agent with output can be re-run from the timeline (`POST /api/agents/[agent]`) → new output version, without redoing the whole pipeline. Use it to rewrite just the newsletter, etc.
3. **Copy-to-clipboard** per piece for fast hand-off into email/CMS tools (full export is Phase 12).

## Notes / boundaries
- Editing a piece does **not** re-run agents; regenerating an agent does **not** auto-overwrite edited pieces (pieces only re-materialize when the pipeline re-passes both gates). This keeps human edits from being silently clobbered — a deliberate trade-off; a "re-materialize from latest outputs" action can be added if needed.
- Metadata is channel-shaped in the action, not free-form, so the editor stays typed.

## Verification checklist
- [ ] Run pipeline on a seeded client → newsletter reflects real intake details, not generic copy.
- [ ] Subject lines respect length; blog has slug + meta; SMS ≤160.
- [ ] Edit a piece body + metadata → persists, status `edited`, survives refresh.
- [ ] Regenerate the newsletter agent → new `agent_outputs` version, run logged.
- [ ] Copy button copies the piece body.

## Hooks for later phases
- Phase 9: Human Editor deterministic scan (`authenticity.ts`) + bounded rewrite loop feeding the score.
- Phase 10: edited/approved `content_pieces` flow into internal + client review.
- Phase 12: export pieces (PDF/HTML) using their metadata.
