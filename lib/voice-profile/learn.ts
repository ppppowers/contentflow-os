import { createClient } from "@/lib/supabase/server";
import { callStructured } from "@/lib/claude/client";
import { getLatestAnalysis } from "@/lib/data/website";
import { voiceProfileSchema, voiceProfileJsonSchema } from "@/lib/validation/voice-profile";

export type LearnResult = { ok: true; profileId: string } | { ok: false; error: string };

const SAMPLE_BUDGET = 24000;

const SYSTEM = `You are the Brand Voice Learning engine for ContentFlow OS.
Given writing samples for a client, infer their brand voice and produce a profile:
- summary: 2-3 sentences capturing the voice.
- vocabulary: signature words/phrases they use (and would).
- tone, personality, formality: short descriptors.
- ctaStyle: how they ask for action.
- doList / dontList: concrete guidance for writers matching this voice.
Base it strictly on the samples. Respond ONLY with JSON matching the schema.`;

export async function learnVoiceProfile(
  clientId: string,
  ctx: { agencyId: string; userId: string },
): Promise<LearnResult> {
  const supabase = createClient();

  const [{ data: brand }, { data: projects }, analysis] = await Promise.all([
    supabase.from("brand_profiles").select("voice_summary, sample_copy, tone_descriptors").eq("client_id", clientId).eq("is_active", true).maybeSingle(),
    supabase.from("content_projects").select("id").eq("client_id", clientId).limit(10),
    getLatestAnalysis(clientId),
  ]);

  const projectIds = ((projects as { id: string }[] | null) ?? []).map((p) => p.id);
  const { data: pieces } = projectIds.length
    ? await supabase.from("content_pieces").select("channel, body").in("project_id", projectIds).limit(20)
    : { data: [] as { channel: string; body: string }[] };

  const samples: string[] = [];
  if (analysis?.payload.brandVoice) samples.push(`[website voice] ${analysis.payload.brandVoice}`);
  if (brand?.sample_copy) samples.push(`[sample copy] ${brand.sample_copy}`);
  if (brand?.voice_summary) samples.push(`[current voice summary] ${brand.voice_summary}`);
  for (const p of (pieces as { channel: string; body: string }[]) ?? []) {
    if (p.body?.trim()) samples.push(`[${p.channel}] ${p.body}`);
  }
  if (samples.length === 0) return { ok: false, error: "No writing samples found to learn from." };

  let parsed;
  try {
    const { data } = await callStructured({
      tier: "strong",
      system: SYSTEM,
      user: `WRITING SAMPLES:\n${samples.join("\n\n").slice(0, SAMPLE_BUDGET)}`,
      schema: voiceProfileJsonSchema,
    });
    parsed = voiceProfileSchema.safeParse(data);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Voice learning failed." };
  }
  if (!parsed.success) return { ok: false, error: "Profile failed validation." };

  const { data: row, error } = await supabase
    .from("voice_profiles")
    .insert({ agency_id: ctx.agencyId, client_id: clientId, payload: parsed.data, created_by: ctx.userId })
    .select("id")
    .single();
  if (error || !row) return { ok: false, error: "Could not save profile." };
  return { ok: true, profileId: row.id as string };
}
