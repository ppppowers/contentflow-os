# Phase 5 — Knowledge Vault

A searchable, intelligence-enriched document store. Staff upload brand guides,
SOPs, flyers, brochures, logos, images, and meeting notes; Claude extracts text +
a summary + tags; every content run searches the vault before writing.

## Schema + storage

`vault_documents` (migration `0016_knowledge_vault.sql`):

| column         | type            | note                                          |
| -------------- | --------------- | --------------------------------------------- |
| client_id      | uuid (nullable) | NULL = agency-wide doc (visible to all staff) |
| title, doc_type| text, enum      | 9 doc types                                   |
| storage_path   | text            | object in private `vault` bucket              |
| tags           | text[]          | manual + AI-suggested                         |
| extracted_text | text            | Claude document intelligence                  |
| summary        | text            | Claude document intelligence                  |
| analyzed       | bool            | has intelligence run                          |
| **search**     | tsvector (generated) | title+summary+extracted_text+tags        |

Indexes: GIN on `search` (FTS), GIN on `tags`, `(agency_id, client_id)`.
RLS: `vault_documents_staff_all` (tenant + staff). Private storage bucket `vault`
with path-scoped policies identical to `intake` — first path segment = agency_id.

## Upload system

`components/vault/VaultUpload.tsx` — direct browser → storage upload (RLS-scoped
by `{agency}/{client}/{uuid}-{file}`), then `recordVaultDocument` server action
records the row with title/type/tags. Mirrors the existing intake upload flow.

## Tagging system

- Manual: comma-separated tags on upload + `updateVaultTags`.
- AI: `analyzeVaultDocument` merges Claude-suggested tags with manual ones.
- Tags are first-class in the FTS vector and have their own GIN index.

## Document intelligence (Claude-only)

```
POST /api/vault/analyze {docId}     (route handler, maxDuration 300)
   ├─ download bytes from private storage
   ├─ analyzeDocumentBytes(bytes, mime, name)        (lib/vault/intelligence.ts)
   │     PDF  → Claude document block
   │     image→ Claude image block (png/jpeg/gif/webp)
   │     callStructured(tier: mid, schema: {summary, extractedText, tags})
   └─ persist summary + extracted_text + merged tags, analyzed=true
```

The Claude client (`lib/claude/client.ts`) gained an optional `attachments` param
(image/document base64 blocks) — the first non-text capability, used only here.
Unsupported mime types (e.g. raw .docx) return null and stay searchable on
title + manual tags.

## Search system

`searchVault(query, {clientId})` — Postgres `websearch_to_tsquery` over the
generated `search` vector, scoped by RLS to the agency and to
`client_id = clientId OR client_id IS NULL`. Empty query → recency browse.
The vault tab exposes a search box; results hydrate full rows for display.

## Retrieval into generation — requirement satisfied

`assembleContext` calls `getVaultContext(clientId, intakeText)` — it searches the
vault with the run's own topic and injects the top matches into the shared prompt
preamble:

```
KNOWLEDGE VAULT — relevant client documents (brand guides, SOPs, flyers, notes).
Ground content in these where applicable:
- (brand_guide) Voice & Tone — Warm, plain language [voice, tone]
```

So Claude **searches the Knowledge Vault before writing** on every run, structurally.

## Verification

- 40/40 unit tests pass (5 new: `buildVaultContextText`, `tagsField`).
- Phase-5 files typecheck clean; total project tsc errors unchanged at 11 (pre-existing).

## Follow-ups

- Extraction is on-demand (staff click "analyze"); auto-analyze on upload could be a background job (Phase aligned with background-jobs).
- `.docx`/`.txt` plain-text extraction (non-vision) could be added without Claude.
- FTS ranking is default; `ts_rank` ordering can be layered if result volume grows.
