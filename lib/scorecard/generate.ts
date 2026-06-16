import { createClient } from "@/lib/supabase/server";
import { callStructured } from "@/lib/claude/client";
import { scanText } from "@/lib/agents/authenticity";
import { evidenceScore } from "@/lib/evidence/score";
import { gatherDeliverables } from "@/lib/qa/store";
import {
  scorecardJudgeSchema,
  scorecardJudgeJsonSchema,
  readabilityScore,
  composeOverall,
  type ScorecardDimension,
} from "@/lib/validation/scorecard";

export type ScorecardResult =
  | { ok: true; scorecardId: string; overall: number; passed: boolean }
  | { ok: false; error: string };

const SYSTEM = `You are the Output Quality scorer for ContentFlow OS. Score the deliverables
0-100 on each: businessValue, brandVoice, engagement, evidence (are claims backed by
specifics?), ctaQuality. Be exacting — 95 is the bar for "ship it". Respond ONLY with JSON.`;

function avg(ns: number[]): number {
  return ns.length ? Math.round(ns.reduce((a, b) => a + b, 0) / ns.length) : 0;
}

export async function generateScorecard(
  projectId: string,
  ctx: { agencyId: string; userId: string },
): Promise<ScorecardResult> {
  const supabase = createClient();
  const pieces = await gatherDeliverables(supabase, projectId);
  if (pieces.length === 0) return { ok: false, error: "No deliverables to score." };
  const corpus = pieces.map((p) => p.body).join("\n\n");

  // Deterministic dimensions.
  const { data: auth } = await supabase
    .from("authenticity_scores")
    .select("score")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const humanAuthenticity = (auth?.score as number | undefined) ?? scanText(corpus).score;
  const specificity = avg(pieces.map((p) => evidenceScore(p.body).score));
  const readability = avg(pieces.map((p) => readabilityScore(p.body)));

  // LLM dimensions.
  let judge;
  try {
    const { data } = await callStructured({
      tier: "strong",
      system: SYSTEM,
      user: `DELIVERABLES:\n${pieces.map((p) => `## ${p.channel}\n${p.body}`).join("\n\n")}`,
      schema: scorecardJudgeJsonSchema,
    });
    judge = scorecardJudgeSchema.safeParse(data);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Scoring failed." };
  }
  if (!judge.success) return { ok: false, error: "Scorecard failed validation." };
  const j = judge.data;

  const scores: Record<ScorecardDimension, number> = {
    businessValue: j.businessValue,
    humanAuthenticity,
    specificity,
    brandVoice: j.brandVoice,
    readability,
    engagement: j.engagement,
    evidence: j.evidence,
    ctaQuality: j.ctaQuality,
  };
  const { overall, passed } = composeOverall(scores);

  const { data: row, error } = await supabase
    .from("scorecards")
    .insert({ agency_id: ctx.agencyId, project_id: projectId, scores, overall, passed, summary: j.summary, created_by: ctx.userId })
    .select("id")
    .single();
  if (error || !row) return { ok: false, error: "Could not save scorecard." };
  return { ok: true, scorecardId: row.id as string, overall, passed };
}
