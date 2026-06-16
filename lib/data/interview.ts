import { createClient } from "@/lib/supabase/server";
import type { IntelligenceBrief } from "@/lib/validation/interview";

export type BriefRow = {
  id: string;
  summary: string;
  readiness_score: number | null;
  payload: IntelligenceBrief;
  created_at: string;
};

// Latest Intelligence Brief for a submission (the active one).
export async function getLatestBrief(submissionId: string): Promise<BriefRow | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("intelligence_briefs")
    .select("id, summary, readiness_score, payload, created_at")
    .eq("submission_id", submissionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as BriefRow | null) ?? null;
}
