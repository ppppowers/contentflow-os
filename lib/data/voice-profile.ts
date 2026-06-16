import { createClient } from "@/lib/supabase/server";
import type { VoiceProfile } from "@/lib/validation/voice-profile";

export type VoiceProfileRow = { id: string; payload: VoiceProfile; created_at: string };

export async function getVoiceProfile(clientId: string): Promise<VoiceProfileRow | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("voice_profiles")
    .select("id, payload, created_at")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as VoiceProfileRow | null) ?? null;
}
