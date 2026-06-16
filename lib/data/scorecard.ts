import { createClient } from "@/lib/supabase/server";
import type { ScorecardDimension } from "@/lib/validation/scorecard";

export type ScorecardRow = {
  id: string;
  scores: Record<ScorecardDimension, number>;
  overall: number;
  passed: boolean;
  summary: string;
  created_at: string;
};

export async function getLatestScorecard(projectId: string): Promise<ScorecardRow | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("scorecards")
    .select("id, scores, overall, passed, summary, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as ScorecardRow | null) ?? null;
}
