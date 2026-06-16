import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/guards";
import { isStaff } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { runQA } from "@/lib/qa/run";

// Multi-layer QA runs several Claude calls — route handler for the time budget.
export const maxDuration = 300;

export async function POST(req: Request) {
  const ctx = await getSessionContext();
  if (!ctx || !isStaff(ctx.role)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }
  const { projectId } = (await req.json().catch(() => ({}))) as { projectId?: string };
  if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

  const supabase = createClient();
  const { data: project } = await supabase.from("content_projects").select("id").eq("id", projectId).maybeSingle();
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const result = await runQA(projectId, { agencyId: ctx.agencyId, userId: ctx.userId }, crypto.randomUUID());
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
