# Phase 24 — SEO Studio

Frase-style workflow built on Claude: research what ranks → outline → write →
optimize → publish to the client's Next.js site as a GitHub pull request →
monitor web presence and AI-answer visibility.

## Steps

| Step | Code | Notes |
|---|---|---|
| Research | `runResearch` (lib/seo/studio.ts) | `callWithWebSearch` (strong, `web_search_20260209`, resumes `pause_turn`) reads live results; a mid-tier structured call turns the notes into `researchSchema` (competitors, questions, gaps, key terms, word target, outline). |
| Outline | `saveOutline` | Editable, one `## Heading — notes` per line. |
| Write | `writeArticle` | Strong tier, brand voice + Business Brain + sitemap URLs for internal links. Output: title, meta, slug, Markdown, FAQ. |
| Optimize | `scoreArticle` (pure) + `improveArticle` | Score 0–100 from key-term and question coverage, length vs. target, structure, metadata, FAQ, and the authenticity scanner. Improve rewrites against the failing checks and AI tells. |
| Publish | `publishArticle` (lib/seo/publish.ts) | GitHub REST with `GITHUB_TOKEN`: branch → `<content_dir>/<slug>.json` (safe HTML via `marked` with raw HTML escaped, FAQ, Article + FAQPage JSON-LD) → sitemap entry → pull request. Nothing goes live until merged. |
| Monitor | `checkWebPresence`, `checkAiVisibility` (lib/seo/monitor.ts) | Web presence via Claude web search (a guide, not a Google rank). AI visibility asks Claude the tracked question with web search and records mention, position and competitors. Weekly via Vercel Cron → `/api/cron/seo` (service client, `CRON_SECRET`). |

## Data (migration 0033)

`site_connections` (per client: site URL, repo, branch, content dir, URL prefix,
sitemap path, brand terms), `seo_articles`, `ai_prompts`, `seo_checks`. All
agency-scoped, staff-only RLS.

## Site side

The target site renders `<content_dir>/<slug>.json` at `<url_prefix>/<slug>`:
`html` into the page body, `title`/`description` into meta tags, `jsonLd` into
`<script type="application/ld+json">`. This needs a one-time page template per site.
