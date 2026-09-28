import type { SupabaseClient } from "@supabase/supabase-js";
import { callStructured, callWithWebSearch } from "@/lib/claude/client";
import { mentionSchema, mentionJsonSchema, presenceSchema, presenceJsonSchema } from "./schemas";

const hostOf = (u: string) => {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

// Brand names/domains that count as a mention: configured terms, else client name + site host.
export async function brandTerms(db: SupabaseClient, clientId: string): Promise<{ name: string; terms: string[]; host: string }> {
  const [{ data: client }, { data: site }] = await Promise.all([
    db.from("clients").select("name, website_url").eq("id", clientId).maybeSingle(),
    db.from("site_connections").select("site_url, brand_terms").eq("client_id", clientId).maybeSingle(),
  ]);
  const host = hostOf((site?.site_url as string) ?? (client?.website_url as string) ?? "");
  const configured = ((site?.brand_terms as string[] | null) ?? []).filter(Boolean);
  const terms = configured.length ? configured : [client?.name as string, host].filter(Boolean);
  return { name: (client?.name as string) ?? "", terms, host };
}

// Position of the first result from the site's domain (deterministic, from the list).
export function findDomainPosition(results: { url: string }[], host: string): { position: number | null; url: string | null } {
  if (!host) return { position: null, url: null };
  const i = results.findIndex((r) => hostOf(r.url) === host || hostOf(r.url).endsWith(`.${host}`));
  return i === -1 ? { position: null, url: null } : { position: i + 1, url: results[i].url };
}

export function mentionsBrand(text: string, terms: string[]): boolean {
  const t = text.toLowerCase();
  return terms.some((term) => term && t.includes(term.toLowerCase()));
}

// Web presence: does the site show up when searching the article's keyword?
// Uses Claude's web search — an approximation of search visibility, not a Google rank.
export async function checkWebPresence(
  db: SupabaseClient,
  article: { id: string; client_id: string; agency_id: string; keyword: string },
) {
  const { host } = await brandTerms(db, article.client_id);
  const search = await callWithWebSearch({
    tier: "mid",
    maxUses: 2,
    system: "You report search results faithfully, in the order the search tool returned them. Do not invent results.",
    user: `Search the web for exactly: "${article.keyword}". List the top 10 results in order as "N. Title — URL". Nothing else.`,
    maxTokens: 3000,
  });
  const { data } = await callStructured<unknown>({
    tier: "cheap",
    system: "Extract the ordered result list. found/position/matchedUrl refer to the given domain.",
    user: `DOMAIN: ${host || "(none)"}\n\n${search.text}`,
    schema: presenceJsonSchema,
    maxTokens: 3000,
  });
  const parsed = presenceSchema.safeParse(data);
  const results = parsed.success && parsed.data.topResults.length ? parsed.data.topResults : search.sources.slice(0, 10);
  const hit = findDomainPosition(results, host);

  const row = {
    agency_id: article.agency_id,
    client_id: article.client_id,
    article_id: article.id,
    kind: "web",
    engine: "claude-web-search",
    query: article.keyword,
    found: hit.position !== null,
    position: hit.position,
    detail: { matchedUrl: hit.url, topResults: results.slice(0, 10) },
  };
  await db.from("seo_checks").insert(row);
  return row;
}

// AI visibility: ask Claude (with web search, like claude.ai) the tracked question
// and record whether the brand is mentioned, where, and which competitors are.
export async function checkAiVisibility(
  db: SupabaseClient,
  prompt: { id: string; client_id: string; agency_id: string; prompt: string },
) {
  const { name, terms } = await brandTerms(db, prompt.client_id);
  const answer = await callWithWebSearch({
    tier: "mid",
    maxUses: 4,
    system: "You are a helpful assistant answering a user's question. Search the web as needed and give a direct, useful answer with specific recommendations.",
    user: prompt.prompt,
    maxTokens: 4000,
  });
  const { data } = await callStructured<unknown>({
    tier: "cheap",
    system:
      "Analyze an AI assistant's answer. mentioned: whether the brand (any of the given names/domains) is named. position: its 1-based order among the products/companies the answer names, or null. excerpt: the sentence mentioning the brand, or the answer's first recommendation if not mentioned. competitors: other products/companies named.",
    user: `BRAND: ${name}\nBRAND TERMS: ${terms.join(", ")}\n\nANSWER:\n${answer.text}`,
    schema: mentionJsonSchema,
    maxTokens: 2000,
  });
  const parsed = mentionSchema.safeParse(data);
  const found = mentionsBrand(answer.text, terms) || (parsed.success && parsed.data.mentioned);

  const row = {
    agency_id: prompt.agency_id,
    client_id: prompt.client_id,
    prompt_id: prompt.id,
    kind: "ai",
    engine: "claude",
    query: prompt.prompt,
    found,
    position: parsed.success ? parsed.data.position : null,
    detail: {
      excerpt: parsed.success ? parsed.data.excerpt : answer.text.slice(0, 300),
      competitors: parsed.success ? parsed.data.competitors : [],
      sources: answer.sources.slice(0, 8),
    },
  };
  await db.from("seo_checks").insert(row);
  return row;
}
