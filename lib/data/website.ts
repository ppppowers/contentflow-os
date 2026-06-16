import { createClient } from "@/lib/supabase/server";
import type { WebsiteAnalysis } from "@/lib/validation/website";

export type AnalysisRow = {
  id: string;
  url: string;
  pages: string[];
  payload: WebsiteAnalysis;
  created_at: string;
};

export async function getLatestAnalysis(clientId: string): Promise<AnalysisRow | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("website_analyses")
    .select("id, url, pages, payload, created_at")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as AnalysisRow | null) ?? null;
}
