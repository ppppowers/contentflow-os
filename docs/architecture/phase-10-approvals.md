# Phase 10 — Approval System (delivered)

Internal review → client review → revisions, driving the `content_projects` status machine. Staff act in the agency shell; clients act in the portal.

## What shipped
| Area | Files |
|------|-------|
| Actions | `lib/actions/approvals.ts` (internal decision, resubmit, mark revision addressed, client decision) |
| Data | `lib/data/approvals.ts` (approvals, revisions, client-portal lists) |
| Decision UI | `components/approvals/DecisionForm.tsx` |
| Agency panel | project page — Review & approval section |
| Client portal | `review/` list + `review/[projectId]` decision view |

## Flow
```
internal_review ──approve──▶ client_review ──client approve──▶ approved
       │                          │
       └─changes─▶ revision_requested ◀─client changes─┘
                       │
                  (staff revises) ──resubmit──▶ internal_review
```
- **Internal decision** (staff): approve → opens a pending client-stage `approvals` row + status `client_review`; request changes → opens a `revisions` row + status `revision_requested`.
- **Client decision** (portal): approve → `approved`; request changes → new `revisions` row + `revision_requested`.
- **Resubmit** (staff): `revision_requested → internal_review`. **Mark addressed** closes a revision.
- Full **approvals + revisions history** shown on the agency project page.

## Decisions taken (delegated)
1. **Client status writes use controlled service-role elevation.** Clients have no RLS write access to `content_projects` or `revisions` (staff-only by design). `clientDecision` first verifies ownership through RLS-scoped reads (`content_projects` + `client_user_links`), confirms the project is actually in `client_review`, **then** uses the service client for the status transition and revision insert — the same pattern as signup onboarding, with an explicit ownership gate.
2. **Two-stage approval rows.** Internal and client decisions are separate `approvals` rows (`stage` enum), preserving who approved what. The client-stage row is created `pending` at hand-off and updated on the client's decision.
3. **Revisions carry scope + instructions**, so a writer sees exactly what each stage asked for; staff explicitly mark them addressed (no silent auto-close).
4. **Client portal is read-only on content** — clients view pieces and decide; they never edit copy (matches the role matrix).

## Security notes
- Staff actions: RLS-scoped + server-side role recheck + `agency_id` from session.
- Client action: role check → ownership verification (project + link) → status precondition → only then elevates. Service client never touches a project the caller doesn't own.
- Client RLS (Phase 2) already lets clients SELECT their projects/pieces and UPDATE their own client-stage approvals; the elevation covers only the cross-table status/revision writes RLS can't express safely for a client.

## Testing note
Client review needs a **client-role user + a `client_user_links` row** (invites still pending since Phase 3/5). For now create one via SQL/dashboard to exercise the portal. The agency-side internal review works end-to-end without it.

## Verification checklist
- [ ] Project at `internal_review`: approve → `client_review` + pending client approval row.
- [ ] Request changes → `revision_requested` + open revision; resubmit returns to `internal_review`.
- [ ] Client (linked) sees the project in `/review`, can read pieces, approve → `approved`.
- [ ] Client request changes → `revision_requested` + revision with scope `client`.
- [ ] A client cannot decide on another client's project (ownership check returns "Not found").
- [ ] Approvals + revisions history renders on the agency page; mark-addressed closes a revision.

## Hooks for later phases
- Phase 11: `approved` → schedule/send + revenue.
- Phase 12: export approved pieces.
- Pending: client-user invite UI to make the portal self-serve.
