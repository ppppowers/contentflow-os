import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/guards";
import { isStaff } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { redTeamReview } from "@/lib/redteam/review";
import { insertQaReview } from "@/lib/qa/store";

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

  const result = await redTeamReview(projectId);
  if (!result.ok) return NextResponse.json(result, { status: 500 });

  // Persist as a standalone red-team review (its own run).
  await insertQaReview(supabase, {
    agencyId: ctx.agencyId,
    projectId,
    runId: crypto.randomUUID(),
    layer: "red_team",
    score: result.result.score,
    passed: result.result.verdict === "pass",
    findings: result.result.findings,
    summary: result.result.summary,
  });
  return NextResponse.json({ ok: true, verdict: result.result.verdict, score: result.result.score });
}
