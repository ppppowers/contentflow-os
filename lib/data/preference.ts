import { createClient } from "@/lib/supabase/server";
import type { PreferenceProfile } from "@/lib/validation/preference";

export type PreferenceRow = { id: string; approval_speed_days: number | null; payload: PreferenceProfile; created_at: string };

export async function getPreferenceProfile(clientId: string): Promise<PreferenceRow | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("preference_profiles")
    .select("id, approval_speed_days, payload, created_at")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as PreferenceRow | null) ?? null;
}
