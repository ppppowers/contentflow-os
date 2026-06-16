# Phase 5 — Client Management (delivered)

Full CRUD for clients + nested brand profile, contacts, notes. Staff-only. Server Actions + Zod, RLS-scoped reads.

## What shipped
| Area | Files |
|------|-------|
| Validation | `lib/validation/client.ts` (client, contact, note, brand schemas + `lines` parser) |
| Actions | `lib/actions/clients.ts` (create/update/delete client, save brand, add/delete contact, add/delete note) |
| Data | `lib/data/clients.ts` (list, get, brand, contacts, notes) |
| Form primitives | `components/ui/form.tsx` (Input, Textarea, Select, Checkbox, SubmitButton, FormError) |
| Resource forms | `components/clients/{ClientForm,BrandProfileForm,AddContactForm,AddNoteForm}.tsx` |
| Pages | `clients/` list, `clients/new`, `clients/[clientId]/` layout + overview/brand/contacts/notes tabs |

## Structure
- **List** (`/clients`) — all agency clients, health + status badges, "New client".
- **Detail** (`/clients/[clientId]`) — tabbed shell (Overview · Brand · Contacts · Notes), 404s on missing/cross-tenant id.
  - **Overview** — edit client fields; admin-only Danger Zone delete (cascades).
  - **Brand** — the voice spec agents honor: voice summary, tone, audience, products, sample copy, **banned phrases**, disclaimers, reading level.
  - **Contacts** — add/remove; single primary enforced.
  - **Notes** — add/remove; pinned sort first.

## Decisions taken (delegated)
1. **One actions file** (`clients.ts`) for the whole client aggregate — fewer files, all mutations co-located, each re-checks `staffContext()`.
2. **Brand profile upsert into the active row** — edits the `is_active=true` row in place (not new versions yet). Versioning (`supersedes_id`) reserved for when agent revisions need history.
3. **List fields as multiline textareas** → `text[]` via the `lines` Zod transform. Simple UX, no tag-input dependency. Banned phrases land exactly where the Human Editor (Phase 9) reads them.
4. **Authorization belt-and-suspenders** — RLS scopes everything to the agency; actions additionally re-check staff role and add `.eq('agency_id', ctx.agencyId)` on writes. Delete gated to admins in UI.
5. **Single primary contact** enforced in the action (clears others on set), not a DB constraint — flexible, avoids migration.

## Security notes
- Every mutation re-validates session + staff role server-side before touching data — never trusts the client.
- Inserts always stamp `agency_id` from the session, never from form input → RLS `WITH CHECK` passes only for the caller's tenant.
- Delete cascades (FKs from Phase 2) remove dependent rows; gated to owner/admin.

## Verification checklist
- [ ] Create client → redirects to its detail page; appears on dashboard + list.
- [ ] Edit persists; brand profile saves and reloads with values.
- [ ] Adding a 2nd primary contact demotes the first.
- [ ] Writer cannot see Danger Zone; admin delete removes client + children.
- [ ] Cross-tenant `/clients/[otherAgencyClientId]` → 404 (RLS returns null).
- [ ] Banned phrases entered here are retrievable for the Human Editor agent.

## Follow-ups (later phases)
- Client-user invites + `client_user_links` UI → still pending; natural fit next time the portal is touched.
- Brand profile versioning history → when agent revision loops need it.
