# Phase 6 — Monthly Intake System (delivered)

Typed monthly intake per client, file uploads to private storage, and an open → submitted → reviewed workflow. Staff-only, RLS-scoped.

## What shipped
| Area | Files |
|------|-------|
| Storage | `supabase/migrations/0012_storage_intake.sql` (private `intake` bucket + path-scoped RLS) |
| Validation | `lib/validation/intake.ts` (8 types, item/file schemas, period helpers) |
| Actions | `lib/actions/intake.ts` (ensure/start, add/delete item, record/delete file, submit, mark reviewed) |
| Data | `lib/data/intake.ts` (submission, items, files, signed URLs) |
| Components | `components/intake/{AddIntakeItemForm,FileUpload}.tsx` |
| Page + tab | `clients/[clientId]/intake/page.tsx`, Intake tab added to client layout |

## The 8 intake types
business_update · promotion · event · testimonial · new_service · volunteer_story · customer_story · announcement

## Workflow
One submission per client + month (unique `client_id, period`). Period = first-of-month `YYYY-MM-01`.
```
(no submission) → [Start intake] → open → [Submit] → submitted → [Mark reviewed] → reviewed
```
- `open` / `submitted` are **editable** (add/remove items + files). `reviewed` locks editing.
- Period switcher (right rail) lists past submissions; `?period=YYYY-MM-01` loads any month.

## File uploads — design (decisions taken)
1. **Private bucket + path-scoped RLS**, not a public bucket. Path = `{agency_id}/{client_id}/{submission_id}/{uuid}-{name}`. Storage `objects` policies require the first path segment to equal `current_agency_id()` AND `is_agency_staff()` → tenant isolation at the storage layer.
2. **Direct browser → Storage upload** (RLS-enforced), then a server action records the `intake_files` row. No service-role, no signed-upload roundtrip. The record action re-checks the path lives under the caller's agency prefix (defense in depth with storage RLS).
3. **Signed download URLs** (10-min TTL) generated server-side per render — files never publicly reachable.
4. **25 MB/file cap** enforced client-side (hard limits configurable in bucket settings later).

## Other decisions
- **Create-on-demand**: no submission row exists until "Start intake" is clicked → no empty rows for untouched months.
- **Delete file removes both** the storage object and the DB row (storage first), guarded by agency-prefix check.
- Intake lives as a **client tab**, consistent with brand/contacts/notes.

## Security notes
- Every action re-checks staff role + stamps `agency_id` from session.
- Storage RLS + DB RLS both scope to agency; upload path validated twice (storage policy + record action).
- Signed URLs short-lived; bucket private.

## Verification checklist
- [ ] Start intake creates one submission; re-visiting doesn't duplicate.
- [ ] Add items of each type; they render grouped with type badges.
- [ ] Upload a file → appears with working signed download link; remove deletes object + row.
- [ ] Submit → status `submitted`; Mark reviewed → locks editing.
- [ ] A staff user from another agency cannot read these objects (storage RLS) — upload path with a foreign prefix is rejected.
- [ ] `?period=` switches months; unique constraint prevents dup submissions.

## Follow-ups
- Malware scanning on upload (Phase 13 hardening).
- Spawning a `content_project` from a reviewed submission → Phase 7 (Agent Framework) wires intake → pipeline.
