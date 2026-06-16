# Phase 13 — Brand Voice Learning V2

Learns a client's voice from many real samples and produces a structured Brand
Voice Profile that can be applied back to the pipeline's `brand_profiles`.

## Sources learned from

`learnVoiceProfile` (Claude strong) gathers: website analysis `brandVoice`
(Phase 8), `brand_profiles.sample_copy` + current voice summary, and recent
`content_pieces` bodies across the client's projects. (Uploaded writing samples
flow in via the Vault/sample copy; voice notes via Phase 9 transcripts.)

## Profile (Claude output)

`voiceProfileSchema` (strict): `summary`, `vocabulary[]`, `tone`, `personality`,
`formality`, `ctaStyle`, `doList[]`, `dontList[]`.

## Storage / flow

`voice_profiles` (migration `0024`): client-scoped, latest = active. New "Voice"
tab → "Learn brand voice" (`POST /api/voice-profile`) → renders the profile.

## Applying to the pipeline

`applyVoiceToBrand` writes the profile's `summary` → `brand_profiles.voice_summary`
and `[tone, personality, formality]` → `tone_descriptors` on the active brand
profile (creating one if absent). The existing prompt preamble already reads
`brand_profiles`, so applying the profile immediately shapes generation — no new
wiring in the agent path.

## Verification

- Tests: `voiceProfileSchema` accept / missing-field reject / strict reject.
- Phase-13 files typecheck clean; total tsc errors unchanged at 11.

## Follow-ups

- Auto-apply on learn (currently a manual "Apply" step to avoid clobbering curated voice).
- Inject `vocabulary`/`dontList` directly into the preamble for finer control.
