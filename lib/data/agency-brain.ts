import { createClient } from "@/lib/supabase/server";
import type { AgencyBrainEntry } from "@/lib/agency-brain/retrieval";

// Management view: ALL agency-brain entries (active + inactive) for the dashboard.
export async function listAgencyBrainEntries(): Promise<AgencyBrainEntry[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("agency_brain_entries")
    .select("id, category, content, authenticity_score, times_used, is_active, source_project_id, created_at")
    .order("category")
    .order("authenticity_score", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  return (data as AgencyBrainEntry[] | null) ?? [];
}
