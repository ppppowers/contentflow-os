import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/guards";
import { isStaff } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { generateBrief } from "@/lib/interview/agent";

// Interview Agent runs a Claude call — route handler for the longer time budget.
export const maxDuration = 300;

export async function POST(req: Request) {
  const ctx = await getSessionContext();
  if (!ctx || !isStaff(ctx.role)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { submissionId } = (await req.json().catch(() => ({}))) as { submissionId?: string };
  if (!submissionId) return NextResponse.json({ error: "submissionId required" }, { status: 400 });

  // RLS-scoped existence check (enforces tenant).
  const supabase = createClient();
  const { data: sub } = await supabase
    .from("intake_submissions")
    .select("id")
    .eq("id", submissionId)
    .maybeSingle();
  if (!sub) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

  const result = await generateBrief(submissionId, { agencyId: ctx.agencyId, userId: ctx.userId });
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
