# ContentFlow OS

AI-powered content agency operating system. Client intake → a 9-agent AI content pipeline → human-grade output → approval → delivery → revenue tracking.

Multi-tenant from day one. Internal use now; white-label later.

## Stack
Next.js 14 (App Router) · TypeScript · Tailwind · Supabase (Postgres + Auth + Storage, RLS) · Claude API · Vercel.

## Core principle
**AUTHENTICITY > READABILITY > SEO > MARKETING.** No single agent writes final content — every piece flows through 9 agents with a humanization gate (Authenticity Score ≥ 90 required).

## The pipeline
`account_manager → research → strategist → newsletter → seo_blog → social → human_editor (≥90 gate) → compliance (gate) → delivery`

## Quick start (local)
```bash
cp .env.local.example .env.local      # fill in keys (see below)
npm install
supabase start                         # local Postgres + Auth + Storage
supabase db reset                      # runs all migrations + seed
npm run dev                            # http://localhost:3000
npm test                               # authenticity scorer unit tests
```
Open `/signup` → create an agency (you become owner) → **+ Create content** → pick or add a client, describe the week, tick "Create images" → the pipeline runs with live progress and the finished posts appear with Copy buttons and images (needs `ANTHROPIC_API_KEY`; images need `OPENAI_API_KEY`). The monthly intake flow still works for agencies that prefer it.

## Environment variables
| Var | Where | Notes |
|-----|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Anon key (RLS enforces access) |
| `SUPABASE_SERVICE_ROLE_KEY` | **server** | Bypasses RLS — onboarding + ownership-gated client decisions only |
| `ANTHROPIC_API_KEY` | **server** | Claude API (the 9 agents) |
| `OPENAI_API_KEY` | **server** | OpenAI image generation (optional — without it, or without credits, each post gets a copy-ready ChatGPT image prompt instead) |
| `OPENAI_IMAGE_MODEL` | **server** | Optional image model override (default `gpt-image-2`) |
| `GITHUB_TOKEN` | **server** | SEO Studio publishing: fine-grained token with Contents + Pull requests (read & write) on client site repos |
| `CRON_SECRET` | **server** | Protects the weekly SEO monitor (`/api/cron/seo`, scheduled in `vercel.json`) |
| `NEXT_PUBLIC_SITE_URL` | public | e.g. `https://app.example.com` |

Never prefix server secrets with `NEXT_PUBLIC_`.

## Deployment
See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for the full Supabase + Vercel guide and the production checklist.

## Architecture docs
Phase-by-phase design + decisions in [`docs/architecture/`](docs/architecture/):
folder structure, database design, technical architecture, agent architecture, security plan, and one doc per build phase (1–14).

## Project layout
```
app/            (auth) (agency) (client-portal) shells + /api routes
components/      ui primitives + feature components
lib/            supabase, auth, agents (pipeline), claude, validation, data, actions, export
supabase/       migrations, seed.sql, config.toml, tests/
docs/           architecture + deployment
tests/          unit tests (vitest)
```
