import { createClient } from "@/lib/supabase/server";

export async function listProjects(archived = false) {
  const supabase = createClient();
  let query = supabase
    .from("content_projects")
    .select("id, title, status, authenticity_score, created_at, clients(name)")
    .order("created_at", { ascending: false });
  query = archived ? query.eq("status", "archived") : query.neq("status", "archived");
  const { data } = await query;
  return (data as unknown as {
    id: string;
    title: string;
    status: string;
    authenticity_score: number | null;
    created_at: string;
    clients: { name: string } | null;
  }[]) ?? [];
}

export async function getProjectBundle(projectId: string) {
  const supabase = createClient();

  const base = "id, title, status, current_agent, authenticity_score, period, clients(name)";
  let { data: project, error } = await supabase
    .from("content_projects")
    .select(`${base}, brief, options`)
    .eq("id", projectId)
    .maybeSingle();
  // Before migration 0031 is applied the brief/options columns don't exist yet.
  if (error?.code === "42703") {
    ({ data: project } = await supabase.from("content_projects").select(base).eq("id", projectId).maybeSingle());
  }
  if (!project) return null;

  const [runs, outputs, pieces, authenticity] = await Promise.all([
    supabase
      .from("agent_runs")
      .select("id, agent, status, model, input_tokens, output_tokens, cost_usd, error, started_at, finished_at")
      .eq("project_id", projectId)
      .order("started_at", { ascending: true }),
    supabase
      .from("agent_outputs")
      .select("id, agent, payload, version, created_at")
      .eq("project_id", projectId)
      .order("version", { ascending: false }),
    supabase
      .from("content_pieces")
      .select("id, channel, body, metadata")
      .eq("project_id", projectId),
    supabase
      .from("authenticity_scores")
      .select("score, flagged_phrases, breakdown, passed, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  // Latest output payload per agent.
  const latest: Record<string, unknown> = {};
  for (const o of (outputs.data as { agent: string; payload: unknown }[]) ?? []) {
    if (!(o.agent in latest)) latest[o.agent] = o.payload;
  }

  return {
    project: project as unknown as {
      id: string;
      title: string;
      status: string;
      current_agent: string | null;
      authenticity_score: number | null;
      brief: string | null;
      options: { images?: boolean } | null;
      clients: { name: string } | null;
    },
    runs: (runs.data as never[]) ?? [],
    latest,
    pieces: (pieces.data as { id: string; channel: string; body: string; metadata: unknown }[]) ?? [],
    authenticity:
      (authenticity.data?.[0] as {
        score: number;
        flagged_phrases: { phrase: string; kind: string; count: number }[];
        breakdown: { llm_score?: number; deterministic_score?: number; deductions?: number; pass?: number };
        passed: boolean;
      } | undefined) ?? null,
  };
}
