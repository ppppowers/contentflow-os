import { createClient } from "@/lib/supabase/server";
import { callStructured } from "@/lib/claude/client";
import { qaJudgeSchema, qaJudgeJsonSchema, rollupQA, QA_PASS_THRESHOLD } from "@/lib/validation/qa";
import { AUTHENTICITY_THRESHOLD } from "@/lib/agents/registry";
import { redTeamReview } from "@/lib/redteam/review";
import { insertQaReview, gatherDeliverables } from "./store";

export type QaRunResult = { ok: true; runId: string; passed: boolean; score: number } | { ok: false; error: string };

const SYSTEM = `You are the QA Department for ContentFlow OS. Judge the deliverables on three
dimensions, each {score 0-100, passed, findings[]}:
- strategy: does it execute a clear, on-target content strategy?
- writing: is the writing tight, specific, and engaging?
- brandVoice: does it match the client's voice and brand?
Be exacting. Respond ONLY with JSON matching the schema.`;

// Multi-layer QA: deterministic layers (humanization, compliance) from real data,
// LLM-judged layers (strategy, writing, brand voice), and the Red Team — all under
// one run_id, plus a 'final' roll-up row.
export async function runQA(
  projectId: string,
  ctx: { agencyId: string; userId: string },
  runId: string,
): Promise<QaRunResult> {
  const supabase = createClient();
  const pieces = await gatherDeliverables(supabase, projectId);
  if (pieces.length === 0) return { ok: false, error: "No deliverables to QA. Run the pipeline first." };

  const layers: { layer: string; score: number; passed: boolean; findings: string[]; summary?: string }[] = [];

  // Humanization (deterministic) — latest authenticity score for the project.
  const { data: auth } = await supabase
    .from("authenticity_scores")
    .select("score, passed")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (auth) {
    layers.push({ layer: "humanization", score: auth.score as number, passed: (auth.score as number) >= AUTHENTICITY_THRESHOLD, findings: [] });
  }

  // Compliance (deterministic) — latest compliance agent output.
  const { data: comp } = await supabase
    .from("agent_outputs")
    .select("payload")
    .eq("project_id", projectId)
    .eq("agent", "compliance")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (comp) {
    const passed = !!(comp.payload as { passed?: boolean }).passed;
    layers.push({ layer: "compliance", score: passed ? 100 : 0, passed, findings: [] });
  }

  // Red Team.
  const rt = await redTeamReview(projectId);
  if (rt.ok) {
    layers.push({ layer: "red_team", score: rt.result.score, passed: rt.result.verdict === "pass", findings: rt.result.findings, summary: rt.result.summary });
  }

  // LLM-judged layers.
  try {
    const { data } = await callStructured({
      tier: "strong",
      system: SYSTEM,
      user: `DELIVERABLES:\n${pieces.map((p) => `## ${p.channel}\n${p.body}`).join("\n\n")}`,
      schema: qaJudgeJsonSchema,
    });
    const judge = qaJudgeSchema.safeParse(data);
    if (judge.success) {
      const j = judge.data;
      layers.push({ layer: "strategy", score: j.strategy.score, passed: j.strategy.passed, findings: j.strategy.findings });
      layers.push({ layer: "writing", score: j.writing.score, passed: j.writing.passed, findings: j.writing.findings });
      layers.push({ layer: "brand_voice", score: j.brandVoice.score, passed: j.brandVoice.passed, findings: j.brandVoice.findings });
    }
  } catch {
    /* judge failure leaves deterministic + red-team layers; final reflects it */
  }

  if (layers.length === 0) return { ok: false, error: "QA produced no layers." };

  const overall = rollupQA(layers.map((l) => ({ score: l.score, passed: l.passed })));
  const finalPassed = overall.passed && overall.score >= QA_PASS_THRESHOLD;

  for (const l of layers) {
    await insertQaReview(supabase, { agencyId: ctx.agencyId, projectId, runId, ...l });
  }
  await insertQaReview(supabase, {
    agencyId: ctx.agencyId,
    projectId,
    runId,
    layer: "final",
    score: overall.score,
    passed: finalPassed,
    findings: layers.filter((l) => !l.passed).map((l) => `${l.layer} did not pass`),
    summary: finalPassed ? "All QA layers passed." : "One or more QA layers failed.",
  });

  return { ok: true, runId, passed: finalPassed, score: overall.score };
}
