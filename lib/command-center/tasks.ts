import { createClient } from "@/lib/supabase/server";
import type { RunContext } from "@/lib/agents/types";

// cc_tasks lifecycle helpers. One row per dispatched unit of work, transitioned
// queued → running → succeeded|failed. The durable record of orchestration.

export type CcTaskKind = "workflow" | "agent";
export type CcTaskStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled";

export type CcTask = {
  id: string;
  kind: CcTaskKind;
  target: string;
  status: CcTaskStatus;
  project_id: string | null;
  priority: number;
  result: Record<string, unknown>;
  error: string | null;
  created_at: string;
  finished_at: string | null;
};

export async function createTask(
  ctx: RunContext,
  input: { kind: CcTaskKind; target: string; projectId: string; priority?: number; payload?: Record<string, unknown> },
): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("cc_tasks")
    .insert({
      agency_id: ctx.agencyId,
      project_id: input.projectId,
      kind: input.kind,
      target: input.target,
      status: "queued",
      priority: input.priority ?? 0,
      requested_by: ctx.userId,
      payload: input.payload ?? {},
    })
    .select("id")
    .single();
  return (data?.id as string | undefined) ?? null;
}

export async function startTask(taskId: string): Promise<void> {
  const supabase = createClient();
  await supabase
    .from("cc_tasks")
    .update({ status: "running", started_at: new Date().toISOString() })
    .eq("id", taskId);
}

export async function finishTask(
  taskId: string,
  outcome: { ok: boolean; result?: Record<string, unknown>; error?: string },
): Promise<void> {
  const supabase = createClient();
  await supabase
    .from("cc_tasks")
    .update({
      status: outcome.ok ? "succeeded" : "failed",
      result: outcome.result ?? {},
      error: outcome.error ?? null,
      finished_at: new Date().toISOString(),
    })
    .eq("id", taskId);
}

export async function listTasks(projectId: string): Promise<CcTask[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("cc_tasks")
    .select("id, kind, target, status, project_id, priority, result, error, created_at, finished_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  return (data as CcTask[] | null) ?? [];
}
