import { createClient } from "@/lib/supabase/server";
import { callStructured } from "@/lib/claude/client";
import { preferenceProfileSchema, preferenceJsonSchema, medianDays } from "@/lib/validation/preference";

export type LearnResult = { ok: true; profileId: string; approvalSpeedDays: number | null } | { ok: false; error: string };

const SYSTEM = `You are the Revision Intelligence engine for ContentFlow OS.
Given a client's revision requests and approval comments, infer a Client Preference
Profile: what they consistently prefer, what they push back on (avoid), their common
revision requests, and tone adjustments they ask for. Base it strictly on the data.
Respond ONLY with JSON matching the schema.`;

export async function learnPreferences(
  clientId: string,
  ctx: { agencyId: string; userId: string },
): Promise<LearnResult> {
  const supabase = createClient();

  const { data: projects } = await supabase
    .from("content_projects")
    .select("id, status, created_at, updated_at")
    .eq("client_id", clientId);
  const projs = (projects as { id: string; status: string; created_at: string; updated_at: string }[] | null) ?? [];
  const projectIds = projs.map((p) => p.id);

  // Deterministic approval turnaround: created → approved (updated_at proxy).
  const approvedDeltas = projs
    .filter((p) => p.status === "approved" || p.status === "sent" || p.status === "scheduled")
    .map((p) => (new Date(p.updated_at).getTime() - new Date(p.created_at).getTime()) / 86_400_000)
    .filter((d) => d >= 0);
  const approvalSpeedDays = medianDays(approvedDeltas);

  const [{ data: revisions }, { data: approvals }] = await Promise.all([
    projectIds.length
      ? supabase.from("revisions").select("scope, instructions").in("project_id", projectIds)
      : Promise.resolve({ data: [] as { scope: string | null; instructions: string }[] }),
    projectIds.length
      ? supabase.from("approvals").select("stage, decision, comment").in("project_id", projectIds)
      : Promise.resolve({ data: [] as { stage: string; decision: string; comment: string | null }[] }),
  ]);

  const revText = ((revisions as { scope: string | null; instructions: string }[]) ?? [])
    .map((r) => `[revision/${r.scope ?? "?"}] ${r.instructions}`)
    .join("\n");
  const apprText = ((approvals as { stage: string; decision: string; comment: string | null }[]) ?? [])
    .filter((a) => a.comment)
    .map((a) => `[${a.stage}/${a.decision}] ${a.comment}`)
    .join("\n");

  if (!revText && !apprText) return { ok: false, error: "No revision or approval history to learn from yet." };

  let parsed;
  try {
    const { data } = await callStructured({
      tier: "strong",
      system: SYSTEM,
      user: `REVISION REQUESTS:\n${revText || "(none)"}\n\nAPPROVAL COMMENTS:\n${apprText || "(none)"}`,
      schema: preferenceJsonSchema,
    });
    parsed = preferenceProfileSchema.safeParse(data);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Learning failed." };
  }
  if (!parsed.success) return { ok: false, error: "Profile failed validation." };

  const { data: row, error } = await supabase
    .from("preference_profiles")
    .insert({
      agency_id: ctx.agencyId,
      client_id: clientId,
      approval_speed_days: approvalSpeedDays,
      payload: parsed.data,
      created_by: ctx.userId,
    })
    .select("id")
    .single();
  if (error || !row) return { ok: false, error: "Could not save profile." };
  return { ok: true, profileId: row.id as string, approvalSpeedDays };
}
