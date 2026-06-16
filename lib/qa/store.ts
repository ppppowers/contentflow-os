import type { SupabaseClient } from "@supabase/supabase-js";

type Db = SupabaseClient<any, "public", any>;

export type QaLayerRow = {
  agencyId: string;
  projectId: string;
  runId: string;
  layer: string;
  score: number;
  passed: boolean;
  findings: string[];
  summary?: string;
};

export async function insertQaReview(supabase: Db, row: QaLayerRow): Promise<void> {
  await supabase.from("qa_reviews").insert({
    agency_id: row.agencyId,
    project_id: row.projectId,
    run_id: row.runId,
    layer: row.layer,
    score: row.score,
    passed: row.passed,
    findings: row.findings,
    summary: row.summary ?? "",
  });
}

// Latest content pieces (deliverables) as one corpus for QA/red-team prompts.
export async function gatherDeliverables(supabase: Db, projectId: string): Promise<{ channel: string; body: string }[]> {
  const { data } = await supabase
    .from("content_pieces")
    .select("channel, body")
    .eq("project_id", projectId);
  return ((data as { channel: string; body: string }[] | null) ?? []).filter((p) => p.body?.trim());
}
