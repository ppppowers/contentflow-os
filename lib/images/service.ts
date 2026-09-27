import { randomUUID } from "crypto";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { createClient } from "@/lib/supabase/server";
import { callStructured } from "@/lib/claude/client";
import { generateImage, imagesConfigured, OpenAIImageError } from "./openai";
import { IMAGE_CHANNELS } from "./channels";

export { IMAGE_CHANNELS };
export const IMAGE_BUCKET = "content-images";

const promptSchema = z.object({
  prompts: z.array(z.object({ channel: z.string(), prompt: z.string() })),
});
const { $schema: _omit, ...promptJsonSchema } = zodToJsonSchema(promptSchema, { target: "jsonSchema7" }) as Record<
  string,
  unknown
>;

const PROMPT_SYSTEM = `You are an art director writing prompts for an AI image generator.
For each content piece you are given, write ONE image prompt that would make a scroll-stopping, on-brand image to post alongside it.
Rules:
- Describe a concrete scene, subject, composition, lighting, and style (e.g. "editorial photo", "flat illustration"). 40-90 words.
- Match the brand's tone and audience. Keep a consistent visual style across all pieces in the set.
- Do NOT put words, letters, logos, or UI text in the image (image models misspell text).
- No real people's likenesses, no trademarks, nothing misleading.
Return one entry per channel given, using the channel name exactly as provided.`;

type Piece = { id: string; channel: string; body: string | null };

// Ask Claude for one image prompt per piece, grounded in the actual copy + brand.
async function writePrompts(projectId: string, pieces: Piece[]): Promise<Map<string, string>> {
  const supabase = createClient();
  const { data: project } = await supabase
    .from("content_projects")
    .select("client_id, brief, clients(name, industry)")
    .eq("id", projectId)
    .single();
  const { data: brand } = project?.client_id
    ? await supabase
        .from("brand_profiles")
        .select("voice_summary, audience, tone_descriptors")
        .eq("client_id", project.client_id)
        .eq("is_active", true)
        .maybeSingle()
    : { data: null };

  const client = (project?.clients as { name?: string; industry?: string | null } | null) ?? null;
  const user = [
    `BRAND: ${client?.name ?? "Unknown"}${client?.industry ? ` (${client.industry})` : ""}`,
    brand?.voice_summary ? `VOICE: ${brand.voice_summary}` : null,
    brand?.audience ? `AUDIENCE: ${brand.audience}` : null,
    project?.brief ? `BRIEF: ${project.brief}` : null,
    "",
    ...pieces.map((p) => `### channel: ${p.channel}\n${(p.body ?? "").slice(0, 2500)}`),
  ]
    .filter((l) => l !== null)
    .join("\n");

  const { data } = await callStructured<unknown>({
    tier: "mid",
    system: PROMPT_SYSTEM,
    user,
    schema: promptJsonSchema,
    maxTokens: 4000,
  });
  const parsed = promptSchema.safeParse(data);
  const out = new Map<string, string>();
  if (parsed.success) for (const p of parsed.data.prompts) out.set(p.channel, p.prompt);
  return out;
}

// promptsOnly: no image was made (no key, out of credits, or OpenAI refused for
// another reason) — the prompts were still written and saved for ChatGPT.
export type ImageJobResult = {
  created: number;
  errors: string[];
  promptsOnly?: "no_key" | "no_credits" | "failed";
  prompts: { channel: string; prompt: string }[];
};

// Generate images for a project. With `channel`, only that piece; with `prompt`,
// use the caller's prompt verbatim instead of asking Claude for one. Prompts are
// always saved on the piece, even when image generation isn't available.
export async function generateProjectImages(
  projectId: string,
  ctx: { agencyId: string; userId: string },
  opts: { channel?: string; prompt?: string; promptsOnly?: boolean } = {},
): Promise<ImageJobResult> {
  const supabase = createClient();
  const { data: rows } = await supabase
    .from("content_pieces")
    .select("id, channel, body")
    .eq("project_id", projectId);
  let pieces = ((rows as Piece[]) ?? []).filter((p) => p.channel in IMAGE_CHANNELS && p.body?.trim());
  if (opts.channel) pieces = pieces.filter((p) => p.channel === opts.channel);
  // A full set skips the blog (the newsletter image usually covers it) to save cost.
  else pieces = pieces.filter((p) => p.channel !== "blog");
  if (pieces.length === 0) {
    return { created: 0, errors: ["No finished content to make images for yet."], prompts: [] };
  }

  const prompts =
    opts.prompt && pieces.length === 1 ? new Map([[pieces[0].channel, opts.prompt]]) : await writePrompts(projectId, pieces);

  // Save each prompt on its piece (ignored if migration 0032 isn't applied yet).
  await Promise.all(
    pieces.map((p) =>
      prompts.has(p.channel)
        ? supabase.from("content_pieces").update({ image_prompt: prompts.get(p.channel) }).eq("id", p.id)
        : null,
    ),
  );
  const promptList = pieces
    .filter((p) => prompts.has(p.channel))
    .map((p) => ({ channel: p.channel, prompt: prompts.get(p.channel)! }));

  if (opts.promptsOnly || !imagesConfigured()) {
    return { created: 0, errors: [], promptsOnly: "no_key", prompts: promptList };
  }

  const errors: string[] = [];
  let created = 0;
  let billing = false;
  await Promise.all(
    pieces.map(async (piece) => {
      const prompt = prompts.get(piece.channel);
      if (!prompt) {
        errors.push(`${piece.channel}: no prompt was written`);
        return;
      }
      try {
        const img = await generateImage(prompt, IMAGE_CHANNELS[piece.channel]);
        const path = `${ctx.agencyId}/${projectId}/${randomUUID()}.png`;
        const { error: upErr } = await supabase.storage
          .from(IMAGE_BUCKET)
          .upload(path, img.png, { contentType: "image/png" });
        if (upErr) throw new Error(`upload failed: ${upErr.message}`);
        const { error: insErr } = await supabase.from("content_images").insert({
          agency_id: ctx.agencyId,
          project_id: projectId,
          piece_id: piece.id,
          channel: piece.channel,
          prompt,
          storage_path: path,
          model: img.model,
          size: img.size,
          created_by: ctx.userId,
        });
        if (insErr) throw new Error(`save failed: ${insErr.message}`);
        created++;
      } catch (e) {
        if (e instanceof OpenAIImageError && e.isBilling) billing = true;
        else errors.push(`${piece.channel}: ${e instanceof Error ? e.message : "failed"}`);
      }
    }),
  );
  if (created === 0) {
    return { created, errors, promptsOnly: billing ? "no_credits" : "failed", prompts: promptList };
  }
  if (billing) errors.push("Some images were skipped: the OpenAI account is out of credits.");
  return { created, errors, prompts: promptList };
}
