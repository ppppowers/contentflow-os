import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/guards";
import { isStaff } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { runAgent } from "@/lib/agents/runner";
import { AGENT_SCHEMAS, type AgentName } from "@/lib/validation/agent-io";

export const maxDuration = 300;

// Run (or re-run) a single agent on a project → new output version.
export async function POST(req: Request, { params }: { params: { agent: string } }) {
  const ctx = await getSessionContext();
  if (!ctx || !isStaff(ctx.role)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const agent = params.agent as AgentName;
  if (!(agent in AGENT_SCHEMAS)) {
    return NextResponse.json({ error: "Unknown agent" }, { status: 400 });
  }

  const body = (await req.json().catch(() => ({}))) as { projectId?: string };
  if (!body.projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

  const supabase = createClient();
  const { data: project } = await supabase
    .from("content_projects")
    .select("id")
    .eq("id", body.projectId)
    .maybeSingle();
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const result = await runAgent(body.projectId, agent, { agencyId: ctx.agencyId, userId: ctx.userId });
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
