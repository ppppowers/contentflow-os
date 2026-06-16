import { AGENT_SCHEMAS, type AgentName } from "@/lib/validation/agent-io";
import { WORKFLOWS, isWorkflow, workflowUpTo, type WorkflowName } from "./workflows";

// Agent routing framework: resolve a dispatch request into a concrete,
// validated execution plan. Pure (no I/O) so it is unit-testable and the
// service layer only ever executes plans the router has vetted.

export type DispatchRequest = {
  kind: "workflow" | "agent";
  target: string;        // WorkflowName or AgentName
  projectId: string;
  upTo?: AgentName;      // optional early stop for workflow runs
};

export type RoutePlan =
  | { ok: true; kind: "workflow"; workflow: WorkflowName; steps: AgentName[]; upTo: AgentName }
  | { ok: true; kind: "agent"; agent: AgentName }
  | { ok: false; error: string };

export function routeRequest(req: DispatchRequest): RoutePlan {
  if (!req.projectId) return { ok: false, error: "projectId required" };

  if (req.kind === "workflow") {
    if (!isWorkflow(req.target)) {
      return { ok: false, error: `Unknown workflow: ${req.target}` };
    }
    const workflow = req.target as WorkflowName;
    const steps = WORKFLOWS[workflow].steps;
    // Clamp an explicit upTo to the workflow's own slice; default to its last step.
    const upTo = req.upTo && steps.includes(req.upTo) ? req.upTo : workflowUpTo(workflow);
    return { ok: true, kind: "workflow", workflow, steps, upTo };
  }

  // Single agent.
  if (!(req.target in AGENT_SCHEMAS)) {
    return { ok: false, error: `Unknown agent: ${req.target}` };
  }
  return { ok: true, kind: "agent", agent: req.target as AgentName };
}
