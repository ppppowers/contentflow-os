import { createClient } from "@/lib/supabase/server";

export type QaLayer = {
  layer: string;
  score: number | null;
  passed: boolean;
  findings: string[];
  summary: string;
  created_at: string;
};

// All layers of the most recent QA run for a project (grouped by run_id).
export async function getLatestQARun(projectId: string): Promise<{ runId: string; layers: QaLayer[] } | null> {
  const supabase = createClient();
  const { data: latest } = await supabase
    .from("qa_reviews")
    .select("run_id, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!latest) return null;
  const runId = latest.run_id as string;

  const { data } = await supabase
    .from("qa_reviews")
    .select("layer, score, passed, findings, summary, created_at")
    .eq("run_id", runId)
    .order("created_at", { ascending: true });
  return { runId, layers: (data as QaLayer[] | null) ?? [] };
}
