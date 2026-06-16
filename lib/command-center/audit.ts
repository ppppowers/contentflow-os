import { createClient } from "@/lib/supabase/server";
import type { RunContext } from "@/lib/agents/types";

// Centralized audit logging for Command Center orchestration events.
// Writes to the existing audit_log table (RLS: any staff insert, admin read).
// Best-effort: a failed audit insert must never abort the work being audited.
export async function logAudit(
  ctx: RunContext,
  event: {
    action: string;          // e.g. "cc.dispatch", "cc.workflow.complete"
    entityType: string;      // e.g. "cc_task", "content_project"
    entityId?: string | null;
    diff?: Record<string, unknown>;
  },
): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.from("audit_log").insert({
      agency_id: ctx.agencyId,
      actor_id: ctx.userId,
      action: event.action,
      entity_type: event.entityType,
      entity_id: event.entityId ?? null,
      diff: event.diff ?? {},
    });
  } catch {
    // Swallow — telemetry must not break orchestration.
  }
}
