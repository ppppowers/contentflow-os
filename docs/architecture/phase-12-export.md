# Phase 12 — Export System (delivered)

Export the delivery package as HTML / Markdown / PDF, copy tools, and an archive system. Staff-only.

## What shipped
| Area | Files |
|------|-------|
| Renderers | `lib/export/render.ts` (`buildMarkdown`, `buildHtml` — pure) |
| Download API | `app/api/export/route.ts` (`?format=html\|md`) |
| Printable page | `app/(agency)/content/[projectId]/export/page.tsx` + `components/content/ExportBar.tsx` |
| Archive | `lib/actions/content.ts` (`archiveProject`/`unarchiveProject`), content list filter |

## Formats
- **Markdown** — `GET /api/export?projectId=…&format=md` → file download. Per-channel sections; newsletter carries subject options + preview, blog carries SEO title/meta/slug/keywords.
- **HTML** — `…&format=html` → styled, self-contained, print-friendly HTML file.
- **PDF** — the **printable page** + browser **Print / Save as PDF**. `@media print` strips the chrome; the article is the page.
- **Copy** — per-piece copy (Phase 8) + "Copy all (markdown)" on the export page.

## Decisions taken (delegated)
1. **No server-side PDF dependency.** PDF is the browser's print-to-PDF on a print-optimized page, not headless Chromium / `@react-pdf`. Zero extra deps, no cold-start/binary weight on Vercel, pixel-faithful to what the user sees. Trade-off: PDF generation is client-initiated (a button), not a server endpoint — fine for an agency tool; a server PDF endpoint can be added later if automated PDF attachments are needed.
2. **Renderers are pure functions**, shared by the download route and the printable page — one source of truth for export shape, unit-testable.
3. **Archive = reversible status transition** (`archived` ⇄ `approved`), not a delete. Content list defaults to active projects with a "View archived" toggle; nothing is destroyed.
4. **HTML/MD are real downloads** (`Content-Disposition: attachment`) so they drop straight into email tools / a CMS.

## Security
- Export route + pages re-check staff role; project + pieces fetched RLS-scoped (tenant-isolated).
- HTML output escapes piece content (no injection into the exported document).

## Verification checklist
- [ ] Export page renders all deliverables; "Print / Save as PDF" produces a clean PDF (no nav/buttons).
- [ ] Download HTML / Markdown returns a file named from the project slug.
- [ ] "Copy all (markdown)" copies the full package.
- [ ] Archive moves the project out of the active list into "View archived"; unarchive restores it.
- [ ] A second agency can't export another agency's project (403 / not found).

## Hooks for later
- Server-side PDF endpoint (if automated attachments are needed).
- Branded HTML templates per client (logo/colors from brand profile).
