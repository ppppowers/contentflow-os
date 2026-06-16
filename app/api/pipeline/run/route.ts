import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/guards";
import { isStaff } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { runPipeline } from "@/lib/agents/orchestrator";
import type { AgentName } from "@/lib/validation/agent-io";

// Long-running agent orchestration. Route handler (not a Server Action) to avoid
// action time limits and keep each step independently invokable.
export const maxDuration = 300;

export async function POST(req: Request) {
  const ctx = await getSessionContext();
  if (!ctx || !isStaff(ctx.role)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as { projectId?: string; upTo?: AgentName };
  if (!body.projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

  // RLS-scoped existence check (also enforces tenant).
  const supabase = createClient();
  const { data: project } = await supabase
    .from("content_projects")
    .select("id")
    .eq("id", body.projectId)
    .maybeSingle();
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const result = await runPipeline(
    body.projectId,
    { agencyId: ctx.agencyId, userId: ctx.userId },
    { upTo: body.upTo },
  );
  return NextResponse.json(result);
}
