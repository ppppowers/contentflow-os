# Phase 8 — Website Intelligence Engine

Fetches a client's public website, analyzes it with Claude, and extracts brand
voice / audience / services / keywords / USPs plus generated newsletter, blog,
and campaign ideas. Findings can be promoted into the Business Brain.

## Pipeline

```
Website tab → "Analyze website"
  → POST /api/website {clientId}          (route handler, maxDuration 300)
       analyzeWebsite(clientId)            (lib/website/analyze.ts)
         ├─ fetchSiteText(url)             (lib/website/fetch.ts) — plain HTTP
         │    fetch homepage → stripHtml
         │    discoverInternalLinks → rankRelevantLinks (about/services/blog/events…)
         │    fetch top 4 pages, strip, budget to 24k chars
         ├─ callStructured(tier: strong, schema: websiteJsonSchema)
         └─ persist website_analyses row
  → tab renders voice/audience/services/keywords/USPs + 3×ideas
  → "Save services & USPs to Business Brain" → brain_entries (source: website)
```

Fetching is ordinary HTTP — no external AI provider. Only the analysis uses
Claude (strong tier). Pages analyzed cover the spec's homepage / about / service
/ blog / events surfaces via relevance-ranked link discovery.

## Extraction + generation (Claude output)

`websiteAnalysisSchema` (strict): `brandVoice`, `audience`, `services[]`,
`keywords[]`, `uniqueSellingPoints[]`, and `ideas.{newsletters, blogs, campaigns}`
(each `{title, angle}`). The model is told to ground everything in the site copy
and not invent.

## Schema / storage

`website_analyses` (migration `0019`): client-scoped, `url`, `pages[]` actually
fetched, full `payload` jsonb, latest row = active. RLS staff-only.

## Pure, tested helpers

`stripHtml`, `absolutize`, `discoverInternalLinks`, `rankRelevantLinks` are pure
and unit-tested (HTML→text, same-host link filtering, relevance ranking,
homepage exclusion) — the network crawl wraps them.

## Verification

- 56/56 unit tests pass (7 new).
- Phase-8 files typecheck clean; total project tsc errors unchanged at 11.

## Security / follow-ups

- **SSRF note:** the engine fetches a staff-entered `website_url` server-side.
  For this internal agency-owner tool the risk is low, but a public/multi-tenant
  deployment should add an allowlist / block private IP ranges + limit redirects.
  Flagged for the Phase 23 enterprise audit.
- Generated ideas are display-only now; Phase 11 (Content Strategy) can turn them
  into a planned roadmap.
- Extracted voice could pre-fill `brand_profiles` (currently only services/USPs
  promote to the Brain) — deferred to avoid overwriting curated voice.
