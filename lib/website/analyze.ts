import { createClient } from "@/lib/supabase/server";
import { callStructured } from "@/lib/claude/client";
import { websiteAnalysisSchema, websiteJsonSchema } from "@/lib/validation/website";
import { fetchSiteText } from "./fetch";

export type AnalyzeResult =
  | { ok: true; analysisId: string; pages: string[] }
  | { ok: false; error: string };

const SYSTEM = `You are the Website Intelligence Engine for ContentFlow OS, a content agency.
You are given the text of a client's website (homepage + key pages). Analyze it and:
- brandVoice: how they sound (tone, formality, personality) in 1-2 sentences.
- audience: who they serve.
- services: their actual services/products (concrete, from the site).
- keywords: 6-12 realistic search terms relevant to their business.
- uniqueSellingPoints: what sets them apart, grounded in the copy.
- ideas: generate newsletter, blog, and campaign ideas (each {title, angle}) that fit
  THIS business — specific, not generic. 3-5 of each.
Only use what the site supports; do not invent facts. Respond ONLY with JSON.`;

// Fetch + analyze a client's website → persist a structured analysis.
export async function analyzeWebsite(
  clientId: string,
  ctx: { agencyId: string; userId: string },
): Promise<AnalyzeResult> {
  const supabase = createClient();
  const { data: client } = await supabase
    .from("clients")
    .select("name, website_url")
    .eq("id", clientId)
    .maybeSingle();
  const url = client?.website_url as string | null;
  if (!url) return { ok: false, error: "Client has no website URL." };

  const site = await fetchSiteText(url);
  if (!site) return { ok: false, error: "Could not fetch the website." };

  let parsed;
  try {
    const { data } = await callStructured({
      tier: "strong",
      system: SYSTEM,
      user: `CLIENT: ${client?.name ?? ""}\n\nWEBSITE CONTENT:\n${site.text}`,
      schema: websiteJsonSchema,
    });
    parsed = websiteAnalysisSchema.safeParse(data);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Analysis failed." };
  }
  if (!parsed.success) return { ok: false, error: "Analysis failed validation." };

  const { data: row, error } = await supabase
    .from("website_analyses")
    .insert({
      agency_id: ctx.agencyId,
      client_id: clientId,
      url,
      pages: site.pages,
      payload: parsed.data,
      created_by: ctx.userId,
    })
    .select("id")
    .single();
  if (error || !row) return { ok: false, error: "Could not save analysis." };

  return { ok: true, analysisId: row.id as string, pages: site.pages };
}
