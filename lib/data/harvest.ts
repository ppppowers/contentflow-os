import { createClient } from "@/lib/supabase/server";

export type Capture = {
  id: string;
  type: string;
  title: string | null;
  body: string | null;
  created_at: string;
};

// Most recent captures for a client across all submissions (harvest feed).
export async function getRecentCaptures(clientId: string, limit = 10): Promise<Capture[]> {
  const supabase = createClient();
  const { data: subs } = await supabase
    .from("intake_submissions")
    .select("id")
    .eq("client_id", clientId);
  const ids = ((subs as { id: string }[] | null) ?? []).map((s) => s.id);
  if (ids.length === 0) return [];

  const { data } = await supabase
    .from("intake_items")
    .select("id, type, title, body, created_at")
    .in("submission_id", ids)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as Capture[] | null) ?? [];
}
