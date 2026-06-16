# Phase 9 — Voice Note & Meeting Intelligence

Turns transcripts — meeting transcripts, Zoom exports, call summaries, voice-note
transcripts — into Meeting Intelligence Reports that extract stories, promotions,
customer wins, and content opportunities, then push them into the pipeline.

## Constraint: Claude has no audio transcription

The platform is Claude-only and Claude exposes no audio-transcription API (text +
vision/PDF only). Adding Whisper/another provider is forbidden. So this engine
operates on **transcript TEXT**:

- Meeting transcripts, Zoom exports, call summaries → paste or load a `.txt/.vtt/.srt`.
- Audio files (MP3/WAV) are still captured + stored via Intake (Phase 6); their
  transcript is pasted here to analyze.
- Honest limitation, flagged for the enterprise audit — a transcription step could
  be added later behind a provider-agnostic boundary if the Claude-only rule relaxes.

## Transcript normalization (pure)

`cleanTranscript` strips VTT/SRT scaffolding (`WEBVTT`, `-->` cue timestamps, SRT
index lines, `NOTE` comments) and bare Zoom `00:12` timestamps, leaving clean
dialogue. Pure → unit-tested against VTT, SRT, Zoom, and plain-text inputs.

## Report (Claude output)

`meetingReportSchema` (strict): `summary`, `extracted.{stories, promotions,
customerWins, contentOpportunities}` (each `{title, detail}`, no invention), and
`notableQuotes[]`. Business Brain context is included so extraction is grounded.

## Flow

```
Meetings tab → VoiceIntake (title, source type, paste/load transcript)
  → POST /api/voice {clientId, title, sourceType, transcript}   (maxDuration 300)
       analyzeTranscript()                                       (lib/voice/analyze.ts)
         ├─ cleanTranscript → budget 40k chars
         ├─ getBrainContext(clientId)
         ├─ callStructured(tier: strong, schema)
         └─ persist meeting_intelligence row
  → report renders: summary, 4 extracted categories, notable quotes
  → "Send opportunities to this month's intake" → captureReportToIntake
       maps categories → intake types, inserts intake_items (ensureSubmission)
```

That last step closes the loop: meeting findings become intake items that flow
into research → strategy → content, exactly like harvested captures.

## Schema / storage

`meeting_intelligence` (migration `0020`): client-scoped, `source_type` enum,
`transcript`, full `payload`. RLS staff-only.

## Verification

- 62/62 unit tests pass (6 new: cleanTranscript ×4, schema + countOpportunities ×2).
- Phase-9 files typecheck clean; total project tsc errors unchanged at 11.

## Follow-ups

- Audio→text transcription deferred (Claude-only). Re-evaluate at Phase 22/23.
- A "from stored audio file" shortcut (pick an intake audio file, then paste its transcript) could streamline the voice-note path.
