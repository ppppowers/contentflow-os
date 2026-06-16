import { createClient } from "@/lib/supabase/server";
import type { GapAnalysis } from "@/lib/validation/gaps";

export async function getLatestGapAnalysis(clientId: string): Promise<{ id: string; payload: GapAnalysis; created_at: string } | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("gap_analyses")
    .select("id, payload, created_at")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as { id: string; payload: GapAnalysis; created_at: string } | null) ?? null;
}
