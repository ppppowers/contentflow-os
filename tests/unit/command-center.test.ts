import { describe, it, expect } from "vitest";
import { routeRequest } from "@/lib/command-center/router";
import { WORKFLOWS, workflowUpTo } from "@/lib/command-center/workflows";

const PROJECT = "00000000-0000-0000-0000-000000000001";

describe("routeRequest — workflows", () => {
  it("resolves a known workflow to its full step slice and last step as upTo", () => {
    const plan = routeRequest({ kind: "workflow", target: "full_content_pipeline", projectId: PROJECT });
    expect(plan.ok).toBe(true);
    if (plan.ok && plan.kind === "workflow") {
      expect(plan.steps).toEqual(WORKFLOWS.full_content_pipeline.steps);
      expect(plan.upTo).toBe(workflowUpTo("full_content_pipeline"));
    }
  });

  it("honors an explicit upTo that lies within the workflow slice", () => {
    const plan = routeRequest({ kind: "workflow", target: "research_brief", projectId: PROJECT, upTo: "research" });
    expect(plan.ok && plan.kind === "workflow" && plan.upTo).toBe("research");
  });

  it("clamps an out-of-slice upTo to the workflow's last step", () => {
    const plan = routeRequest({ kind: "workflow", target: "research_brief", projectId: PROJECT, upTo: "delivery" });
    expect(plan.ok && plan.kind === "workflow" && plan.upTo).toBe("strategist");
  });

  it("rejects an unknown workflow", () => {
    const plan = routeRequest({ kind: "workflow", target: "nope", projectId: PROJECT });
    expect(plan.ok).toBe(false);
  });
});

describe("routeRequest — agents", () => {
  it("resolves a known agent", () => {
    const plan = routeRequest({ kind: "agent", target: "newsletter", projectId: PROJECT });
    expect(plan.ok && plan.kind === "agent" && plan.agent).toBe("newsletter");
  });

  it("rejects an unknown agent", () => {
    const plan = routeRequest({ kind: "agent", target: "ghostwriter", projectId: PROJECT });
    expect(plan.ok).toBe(false);
  });
});

describe("routeRequest — guards", () => {
  it("requires a projectId", () => {
    const plan = routeRequest({ kind: "workflow", target: "full_content_pipeline", projectId: "" });
    expect(plan.ok).toBe(false);
  });
});
