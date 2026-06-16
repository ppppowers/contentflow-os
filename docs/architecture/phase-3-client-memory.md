# Phase 3 — Client Memory System

Persistent per-client memory of everything made, plus similarity detection that
warns when a new topic repeats past content. The platform gets sharper after
every project because agents now see what was already covered.

## Design decision — deterministic similarity, no embeddings

The spec is **Claude-only** and Anthropic exposes no embedding API. Rather than
add a non-Claude embedding provider (forbidden) or pgvector (needs embeddings),
similarity is computed **lexically in-process**: token + bigram Jaccard overlap.

- Pure, deterministic → same inputs, same score → fully unit-tested without I/O.
- No new infra, no external calls, no provider drift.
- Good enough for "is this basically the same topic we did last month?", which is
  the actual product question.

A future phase can swap in vector similarity behind the same `findSimilar`
interface if a Claude-compatible embedding path appears.

## No schema changes — memory derives from durable rows

Content history is reconstructed live from existing tables:

| Memory item            | Source                                              |
| ---------------------- | --------------------------------------------------- |
| Previous newsletters/blogs/social | `content_pieces`                         |
| Previous campaigns/projects/topics | `content_projects` + `agent_outputs` (strategist angles, key messages, subject lines) |
| Revision history       | `revisions` (existing)                              |
| Client preferences     | derived signal now; full profile is Phase 14 (Revision Intelligence) |

No migration. The memory layer is read/compute only, so it can never drift from
the source of truth.

## Components (deliverables)

```
lib/memory/
  similarity.ts  — PURE engine: tokenize, jaccard, similarity(0-100),
                   daysBetween, findSimilar() → ranked matches + message
  history.ts     — Content History service: getContentHistory(clientId),
                   getProjectTopicText(projectId), getRecentTopics(clientId)
  engine.ts      — Memory engine: checkProjectSimilarity(projectId),
                   checkTopicMemory(clientId, candidateText)
```

`topicText` for a project = title + strategist `newsletterAngle`/`blogAngle`/
`keyMessages` + newsletter `subjectLines` — the strongest topical signal, with a
title-only fallback before agents have run.

## Similarity flow

```
project detail page
      │
      ▼
checkProjectSimilarity(projectId)            (lib/memory/engine.ts)
      ├─ getProjectTopicText(projectId)  → candidate probe + clientId
      ├─ getContentHistory(clientId, exclude=projectId)  → past topics
      └─ findSimilar(candidate, history, {now, threshold:35})   [PURE]
            → [{ projectId, title, score, daysAgo, message }]
      ▼
amber "⚠ Content memory" banner:
"This topic is 64% similar to \"Spring Tune-Up Promo\" generated 32 days ago."
(links to the prior project)
```

## Memory fed back into generation

`assembleContext` (the agent context layer) now also loads
`getRecentTopics(clientId)` → `AssembledContext.recentTopics`, and the shared
prompt preamble injects:

```
RECENTLY COVERED (do NOT repeat these without a clearly fresh angle):
- Spring Tune-Up Promo
- April Newsletter
```

So every agent — strategist especially — actively avoids repetition. This is the
self-improving payoff: each finished project tightens the next.

## Tuning

- `threshold` default 35 (UI warning), 30 (engine default). Monthly content for a
  niche client naturally shares vocabulary; tune per agency in a later phase.
- `limit` default 3 matches shown.

## Follow-ups

- A `similarity_checks` log table could record what warnings were shown/dismissed (deferred — YAGNI until there's a dismissal UX).
- Full "client preferences" profile (edit patterns, approval speed) is Phase 14.
