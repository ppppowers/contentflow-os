# Phase 15 — Performance Learning Engine

Tracks per-send performance and generates Performance Insights Reports on what
subject lines, CTAs, and topics actually work.

## Metrics input

No email integration exists yet (Phase 22 is an extension framework only), so
metrics are entered manually (or imported later). `performance_metrics`
(migration `0026`): channel, subject_line, sent/opens/clicks/replies/conversions/
unsubscribes, recorded_at.

Rates are computed by the pure `computeRates` (percentages, 1dp, zero-safe when
nothing sent) — used in the metrics table and fed to the analyzer.

## Insights (Claude output)

`analyzePerformance` builds a rate table from up to 100 metrics and asks Claude
for `performanceReportSchema` (strict): `summary`, `subjectLineInsights[]`,
`ctaInsights[]`, `topicInsights[]`, `recommendations[]`. Stored in
`performance_reports` (latest = active).

## Flow

`/clients/[id]/performance` (new "Performance" tab):
- `MetricForm` → `recordMetric` (one row per send).
- Metrics table with computed rates + delete.
- "Generate insights" (`POST /api/performance`) → report rendered.

## Verification

- Tests: `computeRates` (rounding + zero-sent), `performanceReportSchema` strict.
- Phase-15 files typecheck clean; total tsc errors unchanged at 11.

## Follow-ups

- Real metrics ingestion (ESP webhooks) lands with Phase 22 integrations; the
  schema + analysis are ready to receive them.
- High performers could auto-promote into the Agency Brain (Phase 4), replacing
  the authenticity-score proxy with real performance signal.
