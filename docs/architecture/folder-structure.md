# Folder Structure

Single Next.js (App Router) monorepo. TypeScript throughout.

```
contentflow-os/
├── app/
│   ├── (auth)/                     # unauthenticated routes
│   │   ├── login/
│   │   ├── signup/
│   │   └── reset-password/
│   ├── (agency)/                   # owner/admin/writer shell
│   │   ├── layout.tsx              # sidebar, role guard
│   │   ├── dashboard/              # Phase 4: KPIs, revenue, clients
│   │   ├── clients/
│   │   │   ├── page.tsx            # client list
│   │   │   └── [clientId]/
│   │   │       ├── page.tsx        # profile overview
│   │   │       ├── brand/          # brand profile / voice
│   │   │       ├── contacts/
│   │   │       ├── notes/
│   │   │       ├── intake/         # Phase 6: monthly intake
│   │   │       └── content/        # content projects for client
│   │   ├── content/
│   │   │   └── [projectId]/        # pipeline view: agent runs, drafts, approvals
│   │   ├── revenue/                # Phase 11: MRR, billing
│   │   └── settings/
│   ├── (client-portal)/            # role=client shell (scoped, read-mostly)
│   │   ├── layout.tsx
│   │   ├── review/[projectId]/     # client review + revision requests
│   │   └── approvals/
│   ├── api/
│   │   ├── agents/
│   │   │   └── [agent]/route.ts    # invoke single agent (server-only)
│   │   ├── pipeline/
│   │   │   ├── advance/route.ts    # move project to next pipeline stage
│   │   │   └── run/route.ts        # orchestrate full/partial run
│   │   ├── webhooks/               # billing/email webhooks (later)
│   │   └── export/route.ts         # Phase 12: PDF/HTML
│   └── layout.tsx                  # root, providers
├── components/
│   ├── ui/                         # ShadCN primitives
│   ├── clients/
│   ├── intake/
│   ├── pipeline/                   # status badges, agent timeline
│   ├── content/                    # draft viewers, diff, score gauge
│   ├── revenue/
│   └── shared/
├── lib/
│   ├── supabase/
│   │   ├── server.ts               # server client (service + RLS-scoped)
│   │   ├── client.ts               # browser client
│   │   └── middleware.ts           # session refresh
│   ├── agents/
│   │   ├── orchestrator.ts         # pipeline state machine + handoffs
│   │   ├── runner.ts               # single-agent Claude call + retry
│   │   ├── registry.ts             # agent id → config (model, prompt, schema)
│   │   ├── prompts/                # one file per agent
│   │   │   ├── account-manager.ts
│   │   │   ├── research.ts
│   │   │   ├── strategist.ts
│   │   │   ├── newsletter.ts
│   │   │   ├── seo-blog.ts
│   │   │   ├── social.ts
│   │   │   ├── human-editor.ts
│   │   │   ├── compliance.ts
│   │   │   └── delivery.ts
│   │   ├── memory.ts               # assemble context (brand, research, prior outputs)
│   │   └── authenticity.ts         # banned-phrase scan + scoring
│   ├── claude/
│   │   └── client.ts               # Anthropic SDK wrapper, model tiers
│   ├── validation/                 # Zod schemas (shared)
│   │   ├── client.ts
│   │   ├── intake.ts
│   │   ├── agent-io.ts             # per-agent input/output schemas
│   │   ├── content.ts
│   │   └── billing.ts
│   ├── auth/
│   │   ├── roles.ts                # role enum, permission checks
│   │   └── guards.ts               # server-side route guards
│   ├── queries/                    # TanStack Query hooks
│   └── utils/
├── supabase/
│   ├── migrations/                 # SQL (Phase 2)
│   ├── seed.sql                    # Phase 2 seed
│   └── config.toml
├── types/
│   └── database.types.ts           # generated from Supabase
├── docs/
│   └── architecture/               # this phase
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/                        # Playwright
├── middleware.ts                   # auth + tenant resolution
├── .env.local.example
└── package.json
```

## Conventions
- **Route groups** isolate the three shells: `(agency)`, `(client-portal)`, `(auth)`. Each layout enforces role.
- **Server Actions** for CRUD (clients, intake, notes). **Route Handlers** for agent work (may run seconds–minutes).
- **Zod schemas in `lib/validation/` are the single source of truth** — imported by forms, server actions, and agent I/O.
- **No business logic in components.** Components call `lib/queries/` hooks (read) or server actions (write).
- **Agent prompts are versioned files**, not DB strings, in Phase 1–8. (DB-stored prompt overrides = later white-label feature.)
