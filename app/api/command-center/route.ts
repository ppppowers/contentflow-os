import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/guards";
import { isStaff } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { dispatch } from "@/lib/command-center";
import { dispatchRequestSchema } from "@/lib/validation/command-center";

// Command Center: single entry point for orchestrated agent/workflow execution.
// Route handler (not a Server Action) to avoid action time limits on long runs.
export const maxDuration = 300;

export async function POST(req: Request) {
  const ctx = await getSessionContext();
  if (!ctx || !isStaff(ctx.role)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const parsed = dispatchRequestSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.flatten() }, { status: 400 });
  }

  // RLS-scoped existence check (also enforces tenant isolation).
  const supabase = createClient();
  const { data: project } = await supabase
    .from("content_projects")
    .select("id")
    .eq("id", parsed.data.projectId)
    .maybeSingle();
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const result = await dispatch(parsed.data, { agencyId: ctx.agencyId, userId: ctx.userId });
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
