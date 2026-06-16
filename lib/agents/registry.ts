import type { AgentName } from "@/lib/validation/agent-io";
import type { ModelTier } from "@/lib/claude/client";
import type { ProjectStatus } from "./types";

export type AgentConfig = {
  tier: ModelTier;
  // Upstream agents whose outputs this agent reads (latest version).
  dependsOn: AgentName[];
  // If set, completing this agent advances the project to this status.
  advancesTo?: ProjectStatus;
  // Gate agents can block pipeline progression.
  gate?: "authenticity" | "compliance";
};

// Ordered pipeline. No single agent writes final content — every piece flows through all.
export const SEQUENCE: AgentName[] = [
  "account_manager",
  "research",
  "strategist",
  "newsletter",
  "seo_blog",
  "social",
  "human_editor",
  "compliance",
  "delivery",
];

export const REGISTRY: Record<AgentName, AgentConfig> = {
  account_manager: { tier: "mid", dependsOn: [] },
  research: { tier: "strong", dependsOn: ["account_manager"], advancesTo: "research_complete" },
  strategist: { tier: "strong", dependsOn: ["account_manager", "research"] },
  newsletter: { tier: "strong", dependsOn: ["strategist"] },
  seo_blog: { tier: "mid", dependsOn: ["strategist", "newsletter"] },
  social: { tier: "mid", dependsOn: ["strategist", "newsletter"], advancesTo: "draft_generated" },
  human_editor: {
    tier: "strong",
    dependsOn: ["newsletter", "seo_blog", "social"],
    gate: "authenticity",
  },
  compliance: {
    tier: "mid",
    dependsOn: ["human_editor"],
    gate: "compliance",
    advancesTo: "internal_review",
  },
  delivery: { tier: "cheap", dependsOn: ["human_editor", "compliance"] },
};

// Phase 16 (Humanization Department): raised 90 → 95. Anything lower is rewritten.
export const AUTHENTICITY_THRESHOLD = 95;
