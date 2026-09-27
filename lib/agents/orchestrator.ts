import { createClient } from "@/lib/supabase/server";
import type { AgentName } from "@/lib/validation/agent-io";
import { SEQUENCE, REGISTRY, AUTHENTICITY_THRESHOLD } from "./registry";
import { runAgent } from "./runner";
import { scanEditorOutput, buildRewriteFeedback } from "./authenticity";
import type { RunContext } from "./types";

const MAX_REWRITE_PASSES = 3;

export type PipelineResult = {
  ran: AgentName[];
  stoppedAt?: AgentName;
  reason?: string;
  status: string;
  // Set when `maxSteps` paused the run early: the agent that runs next.
  next?: AgentName;
};

async function latestOutput(projectId: string, agent: AgentName): Promise<Record<string, unknown> | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("agent_outputs")
    .select("payload")
    .eq("project_id", projectId)
    .eq("agent", agent)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.payload as Record<string, unknown>) ?? null;
}

async function setStatus(projectId: string, status: string, currentAgent: AgentName | null) {
  const supabase = createClient();
  await supabase
    .from("content_projects")
    .update({ status, current_agent: currentAgent })
    .eq("id", projectId);
}

// Build content_pieces from the humanized drafts + SEO/newsletter metadata.
async function materializePieces(projectId: string, agencyId: string) {
  const supabase = createClient();
  const [editor, newsletter, seo] = await Promise.all([
    latestOutput(projectId, "human_editor"),
    latestOutput(projectId, "newsletter"),
    latestOutput(projectId, "seo_blog"),
  ]);
  if (!editor) return;
  const social = (editor.humanizedSocial ?? {}) as Record<string, string>;

  const pieces = [
    {
      channel: "newsletter",
      body: editor.humanizedNewsletter as string,
      metadata: {
        subjectLines: newsletter?.subjectLines ?? [],
        previewText: newsletter?.previewText ?? "",
      },
    },
    {
      channel: "blog",
      body: editor.humanizedBlog as string,
      metadata: {
        seoTitle: seo?.seoTitle ?? "",
        metaDescription: seo?.metaDescription ?? "",
        slug: seo?.slug ?? "",
        keywords: seo?.keywords ?? [],
      },
    },
    { channel: "facebook", body: social.facebook ?? "", metadata: {} },
    { channel: "linkedin", body: social.linkedin ?? "", metadata: {} },
    { channel: "instagram", body: social.instagram ?? "", metadata: {} },
    { channel: "sms", body: social.sms ?? "", metadata: {} },
  ];

  // Replace prior pieces for this project (simple regen strategy for Phase 7).
  await supabase.from("content_pieces").delete().eq("project_id", projectId);
  await supabase.from("content_pieces").insert(
    pieces.map((p) => ({
      agency_id: agencyId,
      project_id: projectId,
      channel: p.channel,
      body: p.body,
      metadata: p.metadata,
      status: "draft",
    })),
  );
}

// Run the pipeline from where it left off (agents without output) up to `upTo`.
// Honors gates: Human Editor (≥90) and Compliance must pass before internal_review.
// `steps` lets the Command Center run a named workflow (a subset of SEQUENCE);
// it defaults to the full canonical SEQUENCE so existing callers are unaffected.
export async function runPipeline(
  projectId: string,
  ctx: RunContext,
  opts: { upTo?: AgentName; steps?: AgentName[]; maxSteps?: number } = {},
): Promise<PipelineResult> {
  const supabase = createClient();
  const ran: AgentName[] = [];
  const steps = opts.steps ?? SEQUENCE;

  const { data: existing } = await supabase
    .from("agent_outputs")
    .select("agent")
    .eq("project_id", projectId);
  const done = new Set((existing as { agent: string }[] | null)?.map((r) => r.agent) ?? []);

  const stopIndex = opts.upTo ? steps.indexOf(opts.upTo) : steps.length - 1;

  for (let i = 0; i <= stopIndex; i++) {
    const agent = steps[i];
    if (done.has(agent)) continue;
    // Step mode: callers (the Create page) run one agent per request so each
    // request stays well inside the function time limit and progress is visible.
    if (opts.maxSteps !== undefined && ran.length >= opts.maxSteps) {
      return { ran, status: await currentStatus(projectId), next: agent };
    }

    await setStatus(projectId, await currentStatus(projectId), agent);

    // Humanization gate: bounded rewrite loop, not a single pass.
    if (agent === "human_editor") {
      const gate = await runHumanizationGate(projectId, ctx);
      ran.push(agent);
      if (!gate.ok) {
        return { ran, stoppedAt: agent, reason: gate.reason, status: await currentStatus(projectId) };
      }
      continue;
    }

    const result = await runAgent(projectId, agent, ctx);
    if (!result.ok) {
      return { ran, stoppedAt: agent, reason: result.error, status: await currentStatus(projectId) };
    }
    ran.push(agent);

    const config = REGISTRY[agent];

    // Compliance gate.
    if (config.gate === "compliance") {
      const out = result.output as { passed?: boolean };
      if (!out.passed) {
        await setStatus(projectId, "revision_requested", agent);
        return { ran, stoppedAt: agent, reason: "Compliance failed", status: "revision_requested" };
      }
      // Both gates passed → materialize deliverables.
      await materializePieces(projectId, ctx.agencyId);
    }

    if (config.advancesTo) await setStatus(projectId, config.advancesTo, null);
  }

  return { ran, status: await currentStatus(projectId) };
}

// Two-layer authenticity gate with a bounded rewrite loop.
// final = min(LLM judgment, deterministic scan) — both must clear 90.
// Each failing pass feeds the flagged phrases back to the Human Editor.
async function runHumanizationGate(
  projectId: string,
  ctx: RunContext,
): Promise<{ ok: boolean; score?: number; reason?: string }> {
  const supabase = createClient();

  const { data: proj } = await supabase
    .from("content_projects")
    .select("client_id")
    .eq("id", projectId)
    .single();
  let extraBanned: string[] = [];
  if (proj?.client_id) {
    const { data: brand } = await supabase
      .from("brand_profiles")
      .select("banned_phrases")
      .eq("client_id", proj.client_id)
      .eq("is_active", true)
      .maybeSingle();
    extraBanned = (brand?.banned_phrases as string[] | null) ?? [];
  }

  let feedback = "";
  let lastScore = 0;

  for (let pass = 1; pass <= MAX_REWRITE_PASSES; pass++) {
    const result = await runAgent(projectId, "human_editor", ctx, feedback || undefined);
    if (!result.ok) return { ok: false, reason: result.error };

    const out = result.output as {
      authenticityScore?: number;
      humanizedNewsletter?: string;
      humanizedBlog?: string;
      humanizedSocial?: { facebook?: string; linkedin?: string; instagram?: string; sms?: string };
    };
    const det = scanEditorOutput(out, extraBanned);
    const llm = out.authenticityScore ?? 0;
    const final = Math.min(llm, det.score);
    lastScore = final;

    await supabase.from("content_projects").update({ authenticity_score: final }).eq("id", projectId);
    await supabase.from("authenticity_scores").insert({
      agency_id: ctx.agencyId,
      project_id: projectId,
      run_id: result.runId,
      score: final,
      flagged_phrases: det.flags,
      breakdown: { llm_score: llm, deterministic_score: det.score, deductions: det.deductions, pass },
      passed: final >= AUTHENTICITY_THRESHOLD,
    });

    if (final >= AUTHENTICITY_THRESHOLD) return { ok: true, score: final };
    feedback = buildRewriteFeedback(det.flags);
  }

  await setStatus(projectId, "revision_requested", "human_editor");
  return {
    ok: false,
    score: lastScore,
    reason: `Authenticity ${lastScore} < ${AUTHENTICITY_THRESHOLD} after ${MAX_REWRITE_PASSES} passes — flagged for human review`,
  };
}

async function currentStatus(projectId: string): Promise<string> {
  const supabase = createClient();
  const { data } = await supabase.from("content_projects").select("status").eq("id", projectId).single();
  return (data?.status as string) ?? "intake_received";
}
