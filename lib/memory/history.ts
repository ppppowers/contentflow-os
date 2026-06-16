import { createClient } from "@/lib/supabase/server";
import type { HistoryItem } from "./similarity";

// Content History service — the client's durable record of what has been made.
// Derived live from existing tables (content_projects + agent_outputs); no cache,
// so it is always consistent with the source of truth.

type ProjectRow = { id: string; title: string; period: string | null; created_at: string };
type OutputRow = { project_id: string; agent: string; payload: Record<string, unknown>; version: number };

// Build a single comparable "topic" string for a project from its strategist
// angles + key messages + newsletter subject lines (the strongest topical signal),
// falling back to the title alone before any agents have run.
function topicTextFor(title: string, outputs: OutputRow[]): string {
  const parts: string[] = [title];
  const strategist = outputs.find((o) => o.agent === "strategist")?.payload;
  if (strategist) {
    parts.push(String(strategist.newsletterAngle ?? ""));
    parts.push(String(strategist.blogAngle ?? ""));
    const km = strategist.keyMessages;
    if (Array.isArray(km)) parts.push(km.join(". "));
  }
  const newsletter = outputs.find((o) => o.agent === "newsletter")?.payload;
  if (newsletter && Array.isArray(newsletter.subjectLines)) {
    parts.push((newsletter.subjectLines as string[]).join(". "));
  }
  return parts.filter(Boolean).join(". ");
}

// Past content topics for a client, newest first. Optionally exclude one project
// (the candidate being checked, so it never matches itself).
export async function getContentHistory(
  clientId: string,
  opts: { excludeProjectId?: string; limit?: number } = {},
): Promise<HistoryItem[]> {
  const supabase = createClient();
  let q = supabase
    .from("content_projects")
    .select("id, title, period, created_at")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 50);
  if (opts.excludeProjectId) q = q.neq("id", opts.excludeProjectId);
  const { data: projects } = await q;
  const rows = (projects as ProjectRow[] | null) ?? [];
  if (rows.length === 0) return [];

  const ids = rows.map((p) => p.id);
  const { data: outputs } = await supabase
    .from("agent_outputs")
    .select("project_id, agent, payload, version")
    .in("project_id", ids)
    .in("agent", ["strategist", "newsletter"])
    .order("version", { ascending: false });
  const outByProject = new Map<string, OutputRow[]>();
  for (const o of (outputs as OutputRow[] | null) ?? []) {
    if (!outByProject.has(o.project_id)) outByProject.set(o.project_id, []);
    outByProject.get(o.project_id)!.push(o);
  }

  return rows.map((p) => ({
    projectId: p.id,
    title: p.title,
    topicText: topicTextFor(p.title, outByProject.get(p.id) ?? []),
    date: p.period ?? p.created_at,
  }));
}

// The candidate topic text for a single project (used as the similarity probe).
export async function getProjectTopicText(projectId: string): Promise<{ clientId: string | null; topicText: string } | null> {
  const supabase = createClient();
  const { data: project } = await supabase
    .from("content_projects")
    .select("id, client_id, title")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) return null;

  const { data: outputs } = await supabase
    .from("agent_outputs")
    .select("project_id, agent, payload, version")
    .eq("project_id", projectId)
    .in("agent", ["strategist", "newsletter"])
    .order("version", { ascending: false });

  return {
    clientId: (project.client_id as string) ?? null,
    topicText: topicTextFor(project.title as string, (outputs as OutputRow[] | null) ?? []),
  };
}

// Short list of recently covered topic titles for the agent context (so the
// strategist actively avoids repeating without a fresh angle).
export async function getRecentTopics(
  clientId: string,
  opts: { excludeProjectId?: string; limit?: number } = {},
): Promise<string[]> {
  const history = await getContentHistory(clientId, { ...opts, limit: opts.limit ?? 5 });
  return history.slice(0, opts.limit ?? 5).map((h) => h.title);
}
