"use server";

import { revalidatePath } from "next/cache";
import { createClient as supabaseServer } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/guards";
import { isStaff } from "@/lib/auth/roles";
import { getVoiceProfile } from "@/lib/data/voice-profile";

// Apply the latest learned voice profile to the active brand_profile so the
// content pipeline (which reads brand_profiles) uses it. Updates the active row
// or creates one if none exists.
export async function applyVoiceToBrand(clientId: string): Promise<void> {
  const ctx = await getSessionContext();
  if (!ctx || !isStaff(ctx.role)) return;

  const profile = await getVoiceProfile(clientId);
  if (!profile) return;
  const p = profile.payload;
  const tone = [p.tone, p.personality, p.formality].map((s) => s?.trim()).filter(Boolean) as string[];

  const supabase = supabaseServer();
  const { data: existing } = await supabase
    .from("brand_profiles")
    .select("id")
    .eq("client_id", clientId)
    .eq("is_active", true)
    .maybeSingle();

  const patch = { voice_summary: p.summary, tone_descriptors: tone };
  if (existing) {
    await supabase.from("brand_profiles").update(patch).eq("id", existing.id);
  } else {
    await supabase.from("brand_profiles").insert({ agency_id: ctx.agencyId, client_id: clientId, is_active: true, ...patch });
  }

  revalidatePath(`/clients/${clientId}/voice`);
  revalidatePath(`/clients/${clientId}/brand`);
}
