# Phase 11 — Content Strategy Engine

The Strategic Planning Department generates 30/60/90-day content roadmaps per
client, recommending specific newsletters, blogs, campaigns, and promotions —
each placed on a week and justified.

## Synthesis over the whole intelligence stack

The engine is where Phases 2-10 pay off: it pulls every accumulated signal into
one plan.

```
generatePlan(clientId, horizon)               (lib/strategy/plan.ts)
  gathers in parallel:
    ├─ getBrainContext         (Phase 2 — permanent client knowledge)
    ├─ getRecentTopics         (Phase 3 — avoid repetition)
    ├─ getAgencyPatternsText   (Phase 4 — proven shapes)
    ├─ getLatestAnalysis       (Phase 8 — website-derived ideas)
    └─ listStories             (Phase 10 — available story bank, non-used)
  → callStructured(tier: strong, schema: roadmapJsonSchema)
  → clamp suggestedWeek to 1..(horizon/7)
  → persist content_roadmaps row
```

The prompt favors the client's real stories/services/promos over generic ideas
and is told not to repeat recently covered topics.

## Roadmap shape (Claude output)

`contentRoadmapSchema` (strict): `summary` + `recommendations[]`, each
`{ type (newsletter|blog|campaign|promotion), title, angle, suggestedWeek, rationale }`.
`suggestedWeek` is bounded 1-13 and clamped server-side to the horizon's week count.

## Schema / storage

`content_roadmaps` (migration `0022`): client-scoped, `horizon` (30|60|90 check),
full `payload`, latest row per (client, horizon) = active. RLS staff-only.

## UI

`/clients/[id]/strategy` (new Strategy tab):
- Horizon chips (30 / 60 / 90) switch the active roadmap.
- "Generate N-day roadmap" button.
- Recommendations grouped by week (pure `groupByWeek`), type-colored badges,
  angle + rationale per item.

## Verification

- 73/73 unit tests pass (5 new: isHorizon, roadmap schema accept/type-reject/week-reject, groupByWeek).
- Phase-11 files typecheck clean; total project tsc errors unchanged at 11.

## Follow-ups

- Roadmap items could seed content projects directly (one-click "start this") — pairs with the existing `createProjectFromSubmission` flow; deferred.
- Calendar/date rendering (week → actual dates) once a start date is chosen.
