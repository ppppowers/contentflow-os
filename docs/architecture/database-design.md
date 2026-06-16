# Database Design

Postgres (Supabase). Multi-tenant. Every business table carries `agency_id` and is RLS-scoped. UUID PKs, `created_at`/`updated_at` on all tables. Full DDL + RLS lands in Phase 2 — this doc is the model.

## Tenancy + identity

### `agencies`
Tenant root. One row = one agency (internal use = single row; white-label = many).
`id, name, slug, plan, settings jsonb, created_at, updated_at`

### `profiles`
1:1 with `auth.users`. Carries role + tenant.
`id (=auth.users.id), agency_id, role (enum), full_name, email, avatar_url, created_at`
- `role`: `owner | admin | writer | client`
- A `client` profile also links to a `clients` row via `client_user_links` (a client login can map to one client).

### `client_user_links`
Maps a client-role user to the client account they can view.
`id, agency_id, profile_id, client_id, created_at`

## Client domain

### `clients`
`id, agency_id, name, website_url, industry, status (active|paused|churned), health_score int, created_at, updated_at`

### `client_contacts`
`id, agency_id, client_id, name, email, phone, title, is_primary bool, created_at`

### `brand_profiles`
The voice spec the agents must honor. One per client (latest active).
`id, agency_id, client_id, voice_summary text, tone_descriptors text[], audience text, products_services jsonb, sample_copy text, banned_phrases text[], required_disclaimers text[], reading_level text, version int, is_active bool, created_at`

### `client_notes`
`id, agency_id, client_id, author_id, body text, pinned bool, created_at`

### `monthly_plans`
Per-client per-month engagement record (what we owe them).
`id, agency_id, client_id, period date (first of month), package_id, deliverables jsonb, status, created_at`

## Intake (Phase 6)

### `intake_submissions`
One monthly intake batch per client/period.
`id, agency_id, client_id, period date, submitted_by, status (open|submitted|reviewed), reviewed_by, created_at`

### `intake_items`
Typed pieces of raw monthly input.
`id, agency_id, submission_id, type (enum), title, body text, metadata jsonb, created_at`
- `type`: `business_update | promotion | event | testimonial | new_service | volunteer_story | customer_story | announcement`

### `intake_files`
Storage references for uploads.
`id, agency_id, submission_id, intake_item_id (nullable), storage_path, file_name, mime_type, size_bytes, created_at`

## Content pipeline

### `content_projects`
The unit that flows through the 9-agent pipeline. One per content cycle (e.g. a client's monthly package).
`id, agency_id, client_id, submission_id, period date, title, status (enum), current_agent (enum, nullable), authenticity_score int, created_by, created_at, updated_at`
- `status` enum (the workflow):
  `intake_received | research_complete | draft_generated | internal_review | client_review | revision_requested | approved | scheduled | sent | archived`

### `agent_runs`
Audit log: one row per agent invocation. Append-only.
`id, agency_id, project_id, agent (enum), status (queued|running|succeeded|failed), input_ref jsonb, model, input_tokens, output_tokens, cost_usd numeric, error text, started_at, finished_at`
- `agent` enum: `account_manager | research | strategist | newsletter | seo_blog | social | human_editor | compliance | delivery`

### `agent_outputs`
Structured, versioned output of each agent (the handoff payload).
`id, agency_id, project_id, run_id, agent (enum), payload jsonb, version int, supersedes_id (nullable), created_at`
- `payload` shape is Zod-validated per agent (see agent-architecture.md).

### `content_pieces`
Final/near-final deliverables extracted from agent outputs, per channel.
`id, agency_id, project_id, channel (enum), title, body text, metadata jsonb, version int, status, created_at`
- `channel`: `newsletter | blog | facebook | linkedin | instagram | sms | website_announcement`
- `metadata`: subject_lines[], preview_text, seo_title, meta_description, slug, keywords[] etc.

### `authenticity_scores`
History of humanization scoring per piece/run.
`id, agency_id, project_id, piece_id (nullable), run_id, score int, flagged_phrases jsonb, breakdown jsonb, passed bool, created_at`

## Approval (Phase 10)

### `approvals`
`id, agency_id, project_id, stage (internal|client), decision (pending|approved|changes_requested), decided_by, comment text, created_at`

### `revisions`
`id, agency_id, project_id, approval_id, requested_by, scope text, instructions text, status (open|addressed), created_at`

## Revenue (Phase 11)

### `packages`
`id, agency_id, name, monthly_price numeric, deliverables jsonb, created_at`

### `subscriptions`
Per-client recurring revenue record.
`id, agency_id, client_id, package_id, monthly_amount numeric, status (active|past_due|paused|cancelled), started_at, current_period_start date, current_period_end date, created_at`

### `revenue_events`
Append-only ledger for MRR / LTV math.
`id, agency_id, client_id, subscription_id, type (charge|refund|adjustment), amount numeric, occurred_at, payment_status (paid|pending|failed), created_at`

## Cross-cutting

### `audit_log`
Security/compliance trail for sensitive mutations (auth, billing, deletes).
`id, agency_id, actor_id, action, entity_type, entity_id, diff jsonb, ip, created_at`

## Key relationships
```
agencies 1───* profiles
agencies 1───* clients 1───* client_contacts
                      1───1 brand_profiles (active)
                      1───* client_notes
                      1───* monthly_plans
clients  1───* intake_submissions 1───* intake_items 1───* intake_files
clients  1───* content_projects
content_projects 1───* agent_runs 1───1 agent_outputs
content_projects 1───* content_pieces 1───* authenticity_scores
content_projects 1───* approvals 1───* revisions
clients  1───* subscriptions 1───* revenue_events
```

## Indexing notes (Phase 2)
- Every table: `(agency_id)` index for RLS + tenant filtering.
- `content_projects (agency_id, status)`, `(agency_id, client_id)`.
- `agent_runs (project_id, started_at)`.
- `revenue_events (agency_id, occurred_at)` for MRR window queries.
- `intake_submissions (client_id, period)` unique.

## Enums (Postgres types, defined Phase 2)
`user_role, client_status, intake_type, project_status, agent_name, run_status, content_channel, approval_stage, approval_decision, subscription_status, revenue_event_type`
