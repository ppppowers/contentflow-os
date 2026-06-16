# Phase 11 — Revenue Tracking (delivered)

Manual billing records, an MRR/ARR dashboard, and per-client metrics (MRR + LTV). Admin-only. Uses the Phase 2 tables/views — no schema changes.

## What shipped
| Area | Files |
|------|-------|
| Validation | `lib/validation/revenue.ts` (package, subscription, revenue event) |
| Actions | `lib/actions/revenue.ts` (create package/subscription, update status, record event) |
| Data | `lib/data/revenue.ts` (overview + form options) |
| Forms | `components/revenue/RevenueForms.tsx`, `SubStatusControl.tsx` |
| Dashboard | `app/(agency)/revenue/page.tsx` (rebuilt) |

## Dashboard
- **KPIs:** MRR (from `v_agency_mrr`), ARR (MRR×12), active subs, total subs.
- **Subscriptions table:** per client — MRR (monthly_amount), **LTV** (from `v_client_ltv`), status with an inline status changer.
- **Recent revenue events:** last 15 charges/refunds/adjustments with payment status.
- **Manual entry:** add package, add subscription, record revenue event.

## Where the numbers come from
- **MRR** = `Σ monthly_amount` of `active` subscriptions (`v_agency_mrr`, `security_invoker` → tenant-scoped).
- **LTV** = `Σ paid charges − refunds` per client (`v_client_ltv`).
- **ARR** computed (MRR×12). MRR also drives the Phase 4 dashboard card and Phase 11 here — single source.

## Decisions taken (delegated)
1. **Manual billing** (locked default) — packages/subscriptions/events entered by hand. No Stripe yet; the env has the Stripe MCP, so a webhook-driven sync is a clean later add (subscriptions/events become the projection target).
2. **Append-only ledger.** Revenue is recorded as `revenue_events` (never edited); MRR/LTV are computed views, not stored totals — no drift, fully auditable.
3. **Admin-only, enforced twice.** `requireAdmin` on the page + RLS (`subscriptions`/`revenue_events` admin policies) + every action re-checks `isAdmin`. Writers never see or touch revenue (also gated in the Phase 4 dashboard data layer).
4. **Inline status changes** via a small client control → server action, so the common "pause/cancel" action doesn't need a separate edit screen.
5. **Subscription period** auto-set to the current month on create; cleaner billing-period reporting can layer on later.

## Verification checklist
- [ ] Add a package, then a subscription for a client → MRR + ARR update; row appears with LTV 0.
- [ ] Record a paid charge → LTV for that client increases; event shows in the feed.
- [ ] Record a refund → LTV decreases.
- [ ] Change a subscription to `paused`/`cancelled` → MRR drops (only `active` counts).
- [ ] A writer cannot reach `/revenue` (requireAdmin redirect); a second agency sees only its own figures (RLS + view `security_invoker`).

## Hooks for later
- Stripe-synced billing (webhooks → upsert subscriptions + insert revenue_events).
- Billing-period history / churn + expansion MRR breakdowns.
