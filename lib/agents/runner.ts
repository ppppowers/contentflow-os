import { createClient } from "@/lib/supabase/server";
import { callStructured } from "@/lib/claude/client";
import { AGENT_SCHEMAS, jsonSchemaFor, type AgentName } from "@/lib/validation/agent-io";
import { REGISTRY } from "./registry";
import { assembleContext } from "./memory";
import { buildSystemPrompt, buildUserMessage } from "./prompts";
import type { RunContext } from "./types";

export type RunResult =
  | { ok: true; agent: AgentName; runId: string; output: unknown }
  | { ok: false; agent: AgentName; runId: string | null; error: string };

const MAX_ATTEMPTS = 2;

// Execute ONE agent: assemble context → call Claude → validate → persist run + output.
// Idempotent per run row. Invalid model output never reaches downstream (Zod gate).
export async function runAgent(
  projectId: string,
  agent: AgentName,
  ctx: RunContext,
  feedback?: string,
): Promise<RunResult> {
  const supabase = createClient();
  const config = REGISTRY[agent];

  const { data: runRow, error: runErr } = await supabase
    .from("agent_runs")
    .insert({
      agency_id: ctx.agencyId,
      project_id: projectId,
      agent,
      status: "running",
      model: null,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (runErr || !runRow) return { ok: false, agent, runId: null, error: "Could not create run." };
  const runId = runRow.id as string;

  try {
    const context = await assembleContext(projectId, config.dependsOn);
    const system = buildSystemPrompt(agent, context);
    const baseUser = buildUserMessage(agent, context);
    const user = feedback ? `${baseUser}\n\n---\n\n${feedback}` : baseUser;
    const schema = jsonSchemaFor(agent);

    let lastErr = "";
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const { data, usage } = await callStructured({ tier: config.tier, system, user, schema });
      const parsed = AGENT_SCHEMAS[agent].safeParse(data);
      if (!parsed.success) {
        lastErr = `Output failed validation (attempt ${attempt})`;
        continue;
      }

      // Next version for this agent on this project.
      const { data: prev } = await supabase
        .from("agent_outputs")
        .select("version")
        .eq("project_id", projectId)
        .eq("agent", agent)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();
      const version = ((prev?.version as number | undefined) ?? 0) + 1;

      await supabase.from("agent_outputs").insert({
        agency_id: ctx.agencyId,
        project_id: projectId,
        run_id: runId,
        agent,
        payload: parsed.data,
        version,
      });

      await supabase
        .from("agent_runs")
        .update({
          status: "succeeded",
          model: usage.model,
          input_tokens: usage.inputTokens,
          output_tokens: usage.outputTokens,
          cost_usd: usage.costUsd,
          finished_at: new Date().toISOString(),
        })
        .eq("id", runId);

      return { ok: true, agent, runId, output: parsed.data };
    }

    await supabase
      .from("agent_runs")
      .update({ status: "failed", error: lastErr, finished_at: new Date().toISOString() })
      .eq("id", runId);
    return { ok: false, agent, runId, error: lastErr };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Agent run failed.";
    await supabase
      .from("agent_runs")
      .update({ status: "failed", error: msg, finished_at: new Date().toISOString() })
      .eq("id", runId);
    return { ok: false, agent, runId, error: msg };
  }
}
