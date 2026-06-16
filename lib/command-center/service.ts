import { runPipeline, type PipelineResult } from "@/lib/agents/orchestrator";
import { runAgent } from "@/lib/agents/runner";
import type { RunContext } from "@/lib/agents/types";
import { routeRequest, type DispatchRequest } from "./router";
import { createTask, startTask, finishTask } from "./tasks";
import { logAudit } from "./audit";

// ContentFlow Command Center — the single entry point for orchestrated work.
// Responsibilities: routing (router.ts) → task management (tasks.ts) →
// execution (agents/orchestrator + runner) → audit logging (audit.ts).
//
// Every dispatch is recorded as a cc_task and bracketed by audit events, so a
// run is always reconstructable from the DB, never from ephemeral state.

export type DispatchResult =
  | { ok: true; taskId: string | null; kind: "workflow"; result: PipelineResult }
  | { ok: true; taskId: string | null; kind: "agent"; result: unknown }
  | { ok: false; taskId?: string | null; error: string };

export async function dispatch(req: DispatchRequest, ctx: RunContext): Promise<DispatchResult> {
  const plan = routeRequest(req);
  if (!plan.ok) return { ok: false, error: plan.error };

  const kind = plan.kind;
  const target = kind === "workflow" ? plan.workflow : plan.agent;

  const taskId = await createTask(ctx, {
    kind,
    target,
    projectId: req.projectId,
    payload: { upTo: req.upTo ?? null },
  });
  if (taskId) await startTask(taskId);
  await logAudit(ctx, {
    action: "cc.dispatch",
    entityType: "cc_task",
    entityId: taskId,
    diff: { kind, target, projectId: req.projectId },
  });

  try {
    if (plan.kind === "workflow") {
      const result = await runPipeline(req.projectId, ctx, { steps: plan.steps, upTo: plan.upTo });
      const ok = !result.stoppedAt;
      if (taskId) await finishTask(taskId, { ok, result: result as unknown as Record<string, unknown>, error: result.reason });
      await logAudit(ctx, {
        action: "cc.workflow.complete",
        entityType: "content_project",
        entityId: req.projectId,
        diff: { workflow: plan.workflow, ran: result.ran, stoppedAt: result.stoppedAt ?? null, status: result.status },
      });
      return { ok: true, taskId, kind: "workflow", result };
    }

    const result = await runAgent(req.projectId, plan.agent, ctx);
    if (taskId) await finishTask(taskId, { ok: result.ok, result: result as unknown as Record<string, unknown>, error: result.ok ? undefined : result.error });
    await logAudit(ctx, {
      action: "cc.agent.complete",
      entityType: "content_project",
      entityId: req.projectId,
      diff: { agent: plan.agent, ok: result.ok },
    });
    return { ok: true, taskId, kind: "agent", result };
  } catch (e) {
    const error = e instanceof Error ? e.message : "Dispatch failed.";
    if (taskId) await finishTask(taskId, { ok: false, error });
    return { ok: false, taskId, error };
  }
}
