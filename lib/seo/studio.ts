import type { SupabaseClient } from "@supabase/supabase-js";
import { callStructured, callWithWebSearch } from "@/lib/claude/client";
import { brainContextText, type BrainEntry } from "@/lib/brain/retrieval";
import { buildRewriteFeedback, scanText } from "@/lib/agents/authenticity";
import {
  researchSchema,
  researchJsonSchema,
  articleSchema,
  articleJsonSchema,
  type Research,
  type OutlineItem,
  type FaqItem,
} from "./schemas";
import { scoreArticle } from "./score";
import { fetchSitemapUrls } from "./sitemap";
import { slugify } from "./jsonld";

type Db = SupabaseClient;

export type SeoArticleRow = {
  id: string;
  agency_id: string;
  client_id: string;
  keyword: string;
  status: string;
  research: Research | null;
  outline: OutlineItem[] | null;
  title: string | null;
  slug: string | null;
  meta_description: string | null;
  body_md: string | null;
  faq: FaqItem[];
  score: number | null;
  published_url: string | null;
  pr_url: string | null;
};

export type SiteConnection = {
  client_id: string;
  site_url: string;
  repo: string | null;
  branch: string;
  content_dir: string | null;
  url_prefix: string;
  sitemap_path: string | null;
  brand_terms: string[];
};

async function loadArticle(db: Db, id: string): Promise<SeoArticleRow> {
  const { data, error } = await db.from("seo_articles").select("*").eq("id", id).single();
  if (error || !data) throw new Error("Article not found.");
  return data as SeoArticleRow;
}

// Brand, audience, Business Brain and site details — what makes the article theirs.
async function clientContext(db: Db, clientId: string) {
  const [{ data: client }, { data: brand }, { data: brain }, { data: site }] = await Promise.all([
    db.from("clients").select("name, industry, website_url").eq("id", clientId).maybeSingle(),
    db
      .from("brand_profiles")
      .select("voice_summary, audience, tone_descriptors, banned_phrases, products_services")
      .eq("client_id", clientId)
      .eq("is_active", true)
      .maybeSingle(),
    db
      .from("brain_entries")
      .select("id, category, title, body, data, priority, source, is_active, created_at")
      .eq("client_id", clientId)
      .eq("is_active", true)
      .order("priority", { ascending: false }),
    db.from("site_connections").select("*").eq("client_id", clientId).maybeSingle(),
  ]);
  const siteRow = (site as SiteConnection | null) ?? null;
  const siteUrl = siteRow?.site_url ?? (client?.website_url as string | null) ?? null;
  const lines = [
    `CLIENT: ${client?.name ?? "Unknown"}${client?.industry ? ` (${client.industry})` : ""}`,
    siteUrl ? `WEBSITE: ${siteUrl}` : null,
    brand?.voice_summary ? `VOICE: ${brand.voice_summary}` : null,
    brand?.audience ? `AUDIENCE: ${brand.audience}` : null,
    brand?.tone_descriptors?.length ? `TONE: ${(brand.tone_descriptors as string[]).join(", ")}` : null,
    brand?.products_services && JSON.stringify(brand.products_services) !== "[]"
      ? `PRODUCTS/SERVICES: ${JSON.stringify(brand.products_services)}`
      : null,
  ].filter(Boolean);
  let brainText = "";
  try {
    brainText = brainContextText(((brain as BrainEntry[]) ?? []));
  } catch {
    brainText = "";
  }
  return {
    name: (client?.name as string) ?? "the client",
    siteUrl,
    site: siteRow,
    banned: ((brand?.banned_phrases as string[] | null) ?? []),
    text: [...lines, brainText ? `BUSINESS KNOWLEDGE:\n${brainText}` : null].filter(Boolean).join("\n"),
  };
}

// 1. Research: what ranks now, what people ask, what's missing, and an outline.
export async function runResearch(db: Db, id: string): Promise<Research> {
  const a = await loadArticle(db, id);
  const ctx = await clientContext(db, a.client_id);

  const search = await callWithWebSearch({
    tier: "strong",
    maxUses: 8,
    system: `You are a senior SEO content strategist. Research the live search results for a keyword and report precisely what ranks and why. Be concrete and cite real URLs you found. Never invent pages.`,
    user: `Keyword: "${a.keyword}"

${ctx.text}

Search the web for this keyword (and 1-2 close variants). Then report:
1. Search intent (what the searcher actually wants).
2. The top 5-8 ranking pages: title, URL, their angle, strengths, weaknesses.
3. Questions people ask about this topic (People Also Ask style, forums, AI answers) — 6-12.
4. Content gaps: what the top pages miss or get wrong that ${ctx.name} could cover credibly.
5. Key terms/entities a thorough article should use, marked must/should/nice.
6. Typical word count of the top results and a recommended target.
7. A recommended outline (H2/H3 with one-line notes) for an article that beats them, written for ${ctx.name}'s audience.`,
  });
  if (!search.text) throw new Error("Web search returned nothing. Check that web search is enabled for your Anthropic organization.");

  const { data } = await callStructured<unknown>({
    tier: "mid",
    system: "Convert the research notes into the JSON schema exactly. Keep every real URL. Outline levels: 2 for H2, 3 for H3.",
    user: `${search.text}\n\nSOURCES SEEN:\n${search.sources.map((s) => `- ${s.title} — ${s.url}`).join("\n")}`,
    schema: researchJsonSchema,
    maxTokens: 8000,
  });
  const parsed = researchSchema.safeParse(data);
  if (!parsed.success) throw new Error("Research came back in an unexpected shape. Try again.");

  await db
    .from("seo_articles")
    .update({ research: parsed.data, outline: parsed.data.outline, status: "researched" })
    .eq("id", id);
  return parsed.data;
}

// 2. Write: brief + brand + internal links → full article with FAQ.
export async function writeArticle(db: Db, id: string, feedback?: string): Promise<void> {
  const a = await loadArticle(db, id);
  if (!a.research) throw new Error("Run the research step first.");
  const ctx = await clientContext(db, a.client_id);
  const outline = a.outline?.length ? a.outline : a.research.outline;
  const links = ctx.siteUrl ? await fetchSitemapUrls(ctx.siteUrl, 80) : [];

  const system = `You write search-optimized articles that read like a knowledgeable human wrote them.
PRIORITY: AUTHENTICITY > READABILITY > SEO > MARKETING.
- Follow the outline. Use Markdown: ## for H2, ### for H3. Do NOT include an H1 (the title is rendered separately).
- Answer the searcher's question early. Use specifics: numbers, steps, examples. No fluff, no "In today's fast-paced world", no "delve", no "unlock".
- Work in the key terms naturally; never stuff keywords.
- Mention ${ctx.name} where genuinely relevant (how it helps), not in every section. No fake stats, quotes, or customers.
- Add 3-6 internal links using Markdown links, ONLY to URLs from the provided site list, with descriptive anchor text.
- End with a short conclusion and a soft call to action.
- faq: 4-6 real questions from the research, each answered in 2-4 sentences (these become FAQ rich results).
- title: 45-60 characters, includes the keyword naturally. metaDescription: 130-155 characters. slug: short, lowercase, hyphenated.`;

  const user = `KEYWORD: ${a.keyword}
SEARCH INTENT: ${a.research.searchIntent}
TARGET LENGTH: ~${a.research.recommendedWords} words

${ctx.text}

OUTLINE:
${outline.map((o) => `${o.level === 2 ? "##" : "###"} ${o.heading} — ${o.notes}`).join("\n")}

KEY TERMS: ${a.research.keyTerms.map((t) => `${t.term} (${t.importance})`).join(", ")}
QUESTIONS TO ANSWER: ${a.research.questions.join(" | ")}
GAPS TO EXPLOIT: ${a.research.contentGaps.join(" | ")}

SITE PAGES FOR INTERNAL LINKS:
${links.length ? links.join("\n") : "(none available — skip internal links)"}${feedback ? `\n\n---\nREVISION NOTES (fix these):\n${feedback}` : ""}`;

  const { data } = await callStructured<unknown>({ tier: "strong", system, user, schema: articleJsonSchema, maxTokens: 16000 });
  const parsed = articleSchema.safeParse(data);
  if (!parsed.success) throw new Error("The article came back in an unexpected shape. Try again.");
  const d = parsed.data;

  const score = scoreArticle({
    keyword: a.keyword,
    title: d.title,
    metaDescription: d.metaDescription,
    bodyMd: d.bodyMarkdown,
    faq: d.faq,
    research: a.research,
  });
  await db
    .from("seo_articles")
    .update({
      title: d.title,
      meta_description: d.metaDescription,
      slug: slugify(d.slug || d.title),
      body_md: d.bodyMarkdown,
      faq: d.faq,
      score: score.score,
      score_details: score,
      status: a.status === "published" ? "published" : "drafted",
    })
    .eq("id", id);
}

// 3. Improve: rewrite targeting what the score says is missing + AI tells.
export async function improveArticle(db: Db, id: string): Promise<void> {
  const a = await loadArticle(db, id);
  if (!a.body_md) throw new Error("Write the article first.");
  const ctx = await clientContext(db, a.client_id);
  const s = scoreArticle({
    keyword: a.keyword,
    title: a.title,
    metaDescription: a.meta_description,
    bodyMd: a.body_md,
    faq: a.faq ?? [],
    research: a.research,
  });
  const tells = scanText(a.body_md, ctx.banned);
  const notes = [
    ...s.checks.filter((c) => !c.ok).map((c) => `- ${c.label}: ${c.detail}`),
    s.missingTerms.length ? `- Work in these terms naturally: ${s.missingTerms.join(", ")}` : null,
    s.unansweredQuestions.length ? `- Answer these questions: ${s.unansweredQuestions.join(" | ")}` : null,
    buildRewriteFeedback(tells.flags) || null,
    `- Keep everything that already works. Current draft follows:\n\n${a.body_md}`,
  ]
    .filter(Boolean)
    .join("\n");
  await writeArticle(db, id, notes);
}

// Recompute the score after manual edits.
export function rescore(a: SeoArticleRow) {
  return scoreArticle({
    keyword: a.keyword,
    title: a.title,
    metaDescription: a.meta_description,
    bodyMd: a.body_md,
    faq: a.faq ?? [],
    research: a.research,
  });
}
