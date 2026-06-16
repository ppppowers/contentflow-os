# Phase 22 — White Label & Plugin Framework

Architecture for white-label agencies and third-party integrations. **Framework
only** — per the spec, no actual integrations are built.

## White label

`agency_branding` (migration `0030`): `brand_name`, `logo_url`, `primary_color`,
`custom_domain`, `white_label`. Admin-writable, staff-readable. The agency shell
now renders `brand_name` (falls back to "ContentFlow OS"), so a white-label agency
sees its own name.

## Extension framework

- `lib/extensions/types.ts` — the contract: `IntegrationProvider`,
  `IntegrationPublisher`, `PublishPayload`, `PublishResult`.
- `lib/extensions/registry.ts` — `PROVIDERS` metadata for Mailchimp, Brevo,
  Constant Contact (email), WordPress (cms), Social Publishing (social), plus
  `publishVia()` — the dispatch **extension point**, which returns
  `"Framework only — not implemented yet"`.
- `integration_connections` (migration `0030`): per-agency enable + config
  (admin-only; will hold credentials once integrations are built).

## UI

`/integrations` (admin nav link): white-label branding form + provider list with
enable/disable toggles, each clearly tagged **framework only**.

## Why framework-only is correct here

Building real ESP/CMS/social integrations is a separate milestone with its own
auth, secret storage, and webhook surface. Phase 22 lays the seams — interface,
registry, connection storage, dispatch point — so those integrations slot in
without refactoring. The Performance Engine (Phase 15) is already shaped to
receive their metrics.

## Verification

- Tests: registry coverage + categories, `isProvider`, `publishVia` not-implemented.
