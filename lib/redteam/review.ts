import { createClient } from "@/lib/supabase/server";
import { callStructured } from "@/lib/claude/client";
import { getRecentTopics } from "@/lib/memory/history";
import { redTeamSchema, redTeamJsonSchema, type RedTeam } from "@/lib/validation/qa";
import { gatherDeliverables } from "@/lib/qa/store";

export type RedTeamResult = { ok: true; result: RedTeam } | { ok: false; error: string };

const SYSTEM = `You are the Red Team for ContentFlow OS — a hostile, skeptical reviewer.
Attack the content. Answer honestly:
- isGeneric: could this have been written for any client?
- isRepetitive: does it rehash recently covered topics?
- isUseful: would a real subscriber get something out of it?
- subscribersWouldCare: would they actually open/read this?
- soundsLikeAI: does it read like AI output?
Then give a score (0-100, higher = stronger), a verdict (pass only if it would
genuinely earn a subscriber's attention and isn't generic/AI-sounding), and
specific findings. Be tough. Respond ONLY with JSON matching the schema.`;

// Runs the Red Team on a project's deliverables. Returns data; caller persists.
export async function redTeamReview(projectId: string): Promise<RedTeamResult> {
  const supabase = createClient();
  const [pieces, project] = await Promise.all([
    gatherDeliverables(supabase, projectId),
    supabase.from("content_projects").select("client_id").eq("id", projectId).maybeSingle(),
  ]);
  if (pieces.length === 0) return { ok: false, error: "No deliverables to review. Run the pipeline first." };

  const clientId = (project.data?.client_id as string | undefined) ?? null;
  const recent = clientId ? await getRecentTopics(clientId, { excludeProjectId: projectId, limit: 8 }) : [];

  const user = [
    `DELIVERABLES:\n${pieces.map((p) => `## ${p.channel}\n${p.body}`).join("\n\n")}`,
    recent.length ? `RECENTLY COVERED (repetition check):\n${recent.map((t) => `- ${t}`).join("\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const { data } = await callStructured({ tier: "strong", system: SYSTEM, user, schema: redTeamJsonSchema });
    const parsed = redTeamSchema.safeParse(data);
    if (!parsed.success) return { ok: false, error: "Red Team output failed validation." };
    return { ok: true, result: parsed.data };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Red Team failed." };
  }
}
