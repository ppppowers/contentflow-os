import type { AgentName } from "@/lib/validation/agent-io";
import { SEQUENCE } from "@/lib/agents/registry";

// Named workflows = ordered subsets of the canonical agent SEQUENCE.
// The Command Center routes every multi-agent request to one of these.
// `upTo` is the last agent to run; the orchestrator resumes from the first
// step that has no output yet, so workflows compose (research → drafts → full).
export type WorkflowName =
  | "full_content_pipeline"
  | "research_brief"
  | "draft_generation"
  | "final_review";

export type WorkflowConfig = {
  description: string;
  // Subset of SEQUENCE, in pipeline order. Gates (human_editor/compliance) still
  // apply by agent identity when present in the slice.
  steps: AgentName[];
};

export const WORKFLOWS: Record<WorkflowName, WorkflowConfig> = {
  full_content_pipeline: {
    description: "End-to-end: intake → research → strategy → drafts → humanize → compliance → delivery.",
    steps: SEQUENCE,
  },
  research_brief: {
    description: "Account intake + research + strategy only. Stops before any drafting.",
    steps: ["account_manager", "research", "strategist"],
  },
  draft_generation: {
    description: "Generate channel drafts from an existing strategy (no humanization gate).",
    steps: ["newsletter", "seo_blog", "social"],
  },
  final_review: {
    description: "Humanization gate + compliance + delivery on existing drafts.",
    steps: ["human_editor", "compliance", "delivery"],
  },
};

export function isWorkflow(name: string): name is WorkflowName {
  return name in WORKFLOWS;
}

// The last agent in a workflow → orchestrator `upTo` boundary.
export function workflowUpTo(name: WorkflowName): AgentName {
  const { steps } = WORKFLOWS[name];
  return steps[steps.length - 1];
}
