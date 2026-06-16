import { createClient } from "@/lib/supabase/server";
import { callStructured } from "@/lib/claude/client";
import { getBrainContext } from "@/lib/brain/retrieval";
import { getContentHistory } from "@/lib/memory/history";
import { gapAnalysisSchema, gapJsonSchema } from "@/lib/validation/gaps";

export type GapResult = { ok: true; analysisId: string } | { ok: false; error: string };

const SYSTEM = `You are the Content Gap Analysis engine for ContentFlow OS.
Given a client's content history + known services, identify:
- missingTopics: relevant topics they haven't covered.
- untappedServices: services/offerings rarely or never featured.
- overusedContent: themes/angles leaned on too heavily.
- recommendations: concrete next moves to balance the mix.
Ground it in the data. Respond ONLY with JSON matching the schema.`;

export async function analyzeGaps(
  clientId: string,
  ctx: { agencyId: string; userId: string },
): Promise<GapResult> {
  const supabase = createClient();
  const [history, brainText] = await Promise.all([
    getContentHistory(clientId, { limit: 50 }),
    getBrainContext(clientId),
  ]);
  if (history.length === 0 && !brainText) {
    return { ok: false, error: "Not enough content history to analyze yet." };
  }

  const historyText = history.map((h) => `- ${h.title}: ${h.topicText.slice(0, 200)}`).join("\n");

  let parsed;
  try {
    const { data } = await callStructured({
      tier: "strong",
      system: SYSTEM,
      user: `PAST CONTENT:\n${historyText || "(none)"}\n\nKNOWN SERVICES / KNOWLEDGE:\n${brainText || "(none)"}`,
      schema: gapJsonSchema,
    });
    parsed = gapAnalysisSchema.safeParse(data);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gap analysis failed." };
  }
  if (!parsed.success) return { ok: false, error: "Report failed validation." };

  const { data: row, error } = await supabase
    .from("gap_analyses")
    .insert({ agency_id: ctx.agencyId, client_id: clientId, payload: parsed.data, created_by: ctx.userId })
    .select("id")
    .single();
  if (error || !row) return { ok: false, error: "Could not save analysis." };
  return { ok: true, analysisId: row.id as string };
}
