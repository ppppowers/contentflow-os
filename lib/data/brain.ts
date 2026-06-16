import { createClient } from "@/lib/supabase/server";
import type { BrainEntry } from "@/lib/brain/retrieval";

// Management view: ALL entries (active + inactive) for the Brain dashboard.
// Generation context uses lib/brain/retrieval.getBrainEntries (active only).
export async function listBrainEntries(clientId: string): Promise<BrainEntry[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("brain_entries")
    .select("id, category, title, body, data, priority, source, is_active, created_at")
    .eq("client_id", clientId)
    .order("category")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });
  return (data as BrainEntry[] | null) ?? [];
}
