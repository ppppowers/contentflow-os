import { createClient } from "@/lib/supabase/server";
import { callStructured } from "@/lib/claude/client";
import { getBrainContext } from "@/lib/brain/retrieval";
import { intelligenceBriefSchema, briefJsonSchema } from "@/lib/validation/interview";
import { buildInterviewSystem, buildInterviewUser } from "./prompts";

export type GenerateResult =
  | { ok: true; briefId: string; readinessScore: number }
  | { ok: false; error: string };

// Run the Client Interview Agent on a submission → persist a Monthly Intelligence Brief.
export async function generateBrief(
  submissionId: string,
  ctx: { agencyId: string; userId: string },
): Promise<GenerateResult> {
  const supabase = createClient();

  const { data: sub } = await supabase
    .from("intake_submissions")
    .select("id, client_id, period")
    .eq("id", submissionId)
    .maybeSingle();
  if (!sub) return { ok: false, error: "Submission not found." };
  const clientId = sub.client_id as string;

  const [{ data: client }, { data: items }, { data: files }, brainText] = await Promise.all([
    supabase.from("clients").select("name, industry").eq("id", clientId).maybeSingle(),
    supabase.from("intake_items").select("type, title, body").eq("submission_id", submissionId),
    supabase.from("intake_files").select("file_name").eq("submission_id", submissionId),
    getBrainContext(clientId),
  ]);

  const system = buildInterviewSystem(
    (client as { name: string; industry: string | null } | null) ?? null,
    brainText,
  );
  const user = buildInterviewUser(
    (items as { type: string; title: string | null; body: string | null }[]) ?? [],
    ((files as { file_name: string }[]) ?? []).map((f) => f.file_name),
  );

  let parsed;
  try {
    const { data } = await callStructured({ tier: "strong", system, user, schema: briefJsonSchema });
    parsed = intelligenceBriefSchema.safeParse(data);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Interview agent failed." };
  }
  if (!parsed.success) return { ok: false, error: "Brief failed validation." };
  const brief = parsed.data;

  const { data: row, error } = await supabase
    .from("intelligence_briefs")
    .insert({
      agency_id: ctx.agencyId,
      client_id: clientId,
      submission_id: submissionId,
      period: (sub.period as string) ?? null,
      summary: brief.summary,
      readiness_score: brief.readinessScore,
      payload: brief,
      created_by: ctx.userId,
    })
    .select("id")
    .single();
  if (error || !row) return { ok: false, error: "Could not save brief." };

  return { ok: true, briefId: row.id as string, readinessScore: brief.readinessScore };
}
