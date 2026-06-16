import type { SupabaseClient } from "@supabase/supabase-js";

// Learning engine — harvests proven elements from a winning project into the
// Agency Brain. Called once when a client APPROVES a project (the strongest
// available "this worked" signal until Phase 15 wires real performance data).
//
// Accepts a supabase client so callers pass the right one: the service client
// on a client-role approval (client can't write agency_brain under RLS), or the
// normal client for a staff manual promote.

type Db = SupabaseClient<any, "public", any>;

type Harvest = { category: string; content: string };

export async function harvestProject(
  projectId: string,
  supabase: Db,
  ctx: { agencyId: string; userId?: string },
): Promise<number> {
  // Harvest once per project.
  const { data: already } = await supabase
    .from("agency_brain_entries")
    .select("id")
    .eq("source_project_id", projectId)
    .limit(1);
  if ((already?.length ?? 0) > 0) return 0;

  const { data: project } = await supabase
    .from("content_projects")
    .select("client_id, authenticity_score")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) return 0;
  const score = (project.authenticity_score as number | null) ?? null;

  const { data: outputs } = await supabase
    .from("agent_outputs")
    .select("agent, payload, version")
    .eq("project_id", projectId)
    .in("agent", ["strategist", "newsletter"])
    .order("version", { ascending: false });

  const latest = new Map<string, Record<string, unknown>>();
  for (const o of (outputs as { agent: string; payload: Record<string, unknown> }[] | null) ?? []) {
    if (!latest.has(o.agent)) latest.set(o.agent, o.payload);
  }
  const strategist = latest.get("strategist");
  const newsletter = latest.get("newsletter");

  const harvest: Harvest[] = [];
  if (newsletter && Array.isArray(newsletter.subjectLines)) {
    for (const s of newsletter.subjectLines as string[]) {
      if (s?.trim()) harvest.push({ category: "subject_line", content: s.trim() });
    }
  }
  if (newsletter && typeof newsletter.body === "string" && newsletter.body.trim()) {
    harvest.push({ category: "newsletter", content: newsletter.body.trim() });
  }
  if (strategist && typeof strategist.cta === "string" && strategist.cta.trim()) {
    harvest.push({ category: "cta", content: strategist.cta.trim() });
  }
  if (strategist && typeof strategist.newsletterAngle === "string" && strategist.newsletterAngle.trim()) {
    harvest.push({ category: "campaign", content: strategist.newsletterAngle.trim() });
  }
  if (harvest.length === 0) return 0;

  const rows = harvest.map((h) => ({
    agency_id: ctx.agencyId,
    category: h.category,
    content: h.content,
    source_client_id: (project.client_id as string) ?? null,
    source_project_id: projectId,
    authenticity_score: score,
    created_by: ctx.userId ?? null,
  }));

  // Ignore unique-violation dupes (belt-and-suspenders with the harvest-once check).
  const { error } = await supabase.from("agency_brain_entries").insert(rows);
  if (error && !`${error.message}`.toLowerCase().includes("duplicate")) return 0;
  return rows.length;
}
