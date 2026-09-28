"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient as supabaseServer } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/guards";
import { isStaff } from "@/lib/auth/roles";
import { rescore, type SeoArticleRow } from "@/lib/seo/studio";
import {
  newSeoArticleSchema,
  articleEditSchema,
  parseOutline,
  siteConnectionSchema,
  promptSchema,
} from "@/lib/validation/seo";

export type ActionResult = { error: string } | { ok: true };

async function staff() {
  const ctx = await getSessionContext();
  return ctx && isStaff(ctx.role) ? ctx : null;
}

const MIGRATION_HINT = "The database needs an update first: apply migration 0033_seo_studio.sql in Supabase.";

export async function createSeoArticle(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const ctx = await staff();
  if (!ctx) return { error: "Not authorized." };
  const parsed = newSeoArticleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const { data, error } = await supabaseServer()
    .from("seo_articles")
    .insert({ agency_id: ctx.agencyId, client_id: parsed.data.clientId, keyword: parsed.data.keyword, created_by: ctx.userId })
    .select("id")
    .single();
  if (error?.code === "42P01") return { error: MIGRATION_HINT };
  if (error || !data) return { error: "Could not create the article." };
  revalidatePath("/seo");
  redirect(`/seo/${data.id}?start=1`);
}

export async function saveOutline(articleId: string, _prev: unknown, formData: FormData): Promise<ActionResult> {
  if (!(await staff())) return { error: "Not authorized." };
  const outline = parseOutline(String(formData.get("outline") ?? ""));
  if (outline.length < 2) return { error: "Add at least two sections." };
  const { error } = await supabaseServer().from("seo_articles").update({ outline }).eq("id", articleId);
  if (error) return { error: "Could not save the outline." };
  revalidatePath(`/seo/${articleId}`);
  return { ok: true };
}

export async function saveArticleEdits(articleId: string, _prev: unknown, formData: FormData): Promise<ActionResult> {
  if (!(await staff())) return { error: "Not authorized." };
  const parsed = articleEditSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const db = supabaseServer();
  const { data: row } = await db.from("seo_articles").select("*").eq("id", articleId).single();
  if (!row) return { error: "Article not found." };
  const next = {
    ...(row as SeoArticleRow),
    title: parsed.data.title,
    meta_description: parsed.data.metaDescription,
    slug: parsed.data.slug,
    body_md: parsed.data.bodyMd,
  };
  const score = rescore(next);
  const { error } = await db
    .from("seo_articles")
    .update({
      title: next.title,
      meta_description: next.meta_description,
      slug: next.slug,
      body_md: next.body_md,
      score: score.score,
      score_details: score,
    })
    .eq("id", articleId);
  if (error) return { error: "Could not save." };
  revalidatePath(`/seo/${articleId}`);
  return { ok: true };
}

export async function deleteSeoArticle(articleId: string): Promise<void> {
  if (!(await staff())) return;
  await supabaseServer().from("seo_articles").delete().eq("id", articleId);
  revalidatePath("/seo");
  redirect("/seo");
}

export async function saveSiteConnection(clientId: string, _prev: unknown, formData: FormData): Promise<ActionResult> {
  const ctx = await staff();
  if (!ctx) return { error: "Not authorized." };
  const parsed = siteConnectionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const v = parsed.data;
  if (v.contentDir && /(^|\/)\.\.(\/|$)/.test(v.contentDir)) return { error: "Content folder can't contain '..'." };

  const { error } = await supabaseServer()
    .from("site_connections")
    .upsert(
      {
        agency_id: ctx.agencyId,
        client_id: clientId,
        site_url: v.siteUrl.replace(/\/+$/, ""),
        repo: v.repo ?? null,
        branch: v.branch,
        content_dir: v.contentDir?.replace(/^\/+|\/+$/g, "") ?? null,
        url_prefix: v.urlPrefix.replace(/\/+$/, "") || "/resources",
        sitemap_path: v.sitemapPath?.replace(/^\/+/, "") ?? null,
        brand_terms: (v.brandTerms ?? "").split(",").map((t) => t.trim()).filter(Boolean),
      },
      { onConflict: "client_id" },
    );
  if (error?.code === "42P01") return { error: MIGRATION_HINT };
  if (error) return { error: "Could not save the site connection." };
  revalidatePath("/seo/sites");
  return { ok: true };
}

export async function addTrackedPrompt(clientId: string, _prev: unknown, formData: FormData): Promise<ActionResult> {
  const ctx = await staff();
  if (!ctx) return { error: "Not authorized." };
  const parsed = promptSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const { error } = await supabaseServer()
    .from("ai_prompts")
    .insert({ agency_id: ctx.agencyId, client_id: clientId, prompt: parsed.data.prompt });
  if (error?.code === "42P01") return { error: MIGRATION_HINT };
  if (error) return { error: "Could not add the question." };
  revalidatePath("/seo/visibility");
  return { ok: true };
}

export async function deleteTrackedPrompt(promptId: string): Promise<void> {
  if (!(await staff())) return;
  await supabaseServer().from("ai_prompts").delete().eq("id", promptId);
  revalidatePath("/seo/visibility");
}
