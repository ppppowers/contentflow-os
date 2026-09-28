import type { SupabaseClient } from "@supabase/supabase-js";
import { markdownToHtml } from "./html";
import { buildJsonLd, slugify } from "./jsonld";
import type { SeoArticleRow, SiteConnection } from "./studio";

const API = "https://api.github.com";

export function publishingConfigured(): boolean {
  return !!process.env.GITHUB_TOKEN;
}

async function gh<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const body = (await res.json().catch(() => null)) as T & { message?: string };
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${body?.message ?? res.statusText} (${path.split("?")[0]})`);
  return body;
}

const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64");
const validRepo = (r: string) => /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(r);
const cleanDir = (d: string) => d.replace(/^\/+|\/+$/g, "");
const encPath = (p: string) => p.split("/").map(encodeURIComponent).join("/");

// The file a Next.js site reads to render the article. Framework-agnostic JSON:
// the page template renders `html` and puts `jsonLd` in <script type="application/ld+json">.
export function buildArticleFile(a: SeoArticleRow, site: SiteConnection, publisher: string, now = new Date()) {
  const slug = a.slug || slugify(a.title ?? a.keyword);
  const prefix = "/" + cleanDir(site.url_prefix || "/resources");
  const siteUrl = site.site_url.replace(/\/+$/, "");
  const url = `${siteUrl}${prefix}/${slug}`;
  const date = now.toISOString().slice(0, 10);
  return {
    url,
    path: `${prefix}/${slug}`,
    file: {
      slug,
      title: a.title ?? a.keyword,
      description: a.meta_description ?? "",
      keyword: a.keyword,
      datePublished: date,
      dateModified: date,
      html: markdownToHtml(a.body_md ?? ""),
      faq: a.faq ?? [],
      jsonLd: buildJsonLd({
        url,
        title: a.title ?? a.keyword,
        description: a.meta_description ?? "",
        publisher,
        siteUrl,
        datePublished: date,
        faq: a.faq ?? [],
      }),
    },
  };
}

// Insert a <url> entry before </urlset> unless the URL is already listed.
export function addToSitemap(xml: string, url: string, lastmod: string): string {
  if (xml.includes(`<loc>${url}</loc>`)) return xml;
  const entry = `  <url><loc>${url}</loc><lastmod>${lastmod}</lastmod></url>\n`;
  return xml.includes("</urlset>") ? xml.replace("</urlset>", `${entry}</urlset>`) : xml;
}

// Opens a pull request adding the article (and sitemap entry) to the site repo.
// Nothing goes live until someone merges it.
export async function publishArticle(db: SupabaseClient, articleId: string): Promise<{ prUrl: string; url: string }> {
  if (!publishingConfigured()) throw new Error("Publishing isn't set up: add GITHUB_TOKEN in Vercel → Settings → Environment Variables.");
  const { data: a } = await db.from("seo_articles").select("*").eq("id", articleId).single();
  if (!a) throw new Error("Article not found.");
  const article = a as SeoArticleRow;
  if (!article.body_md || !article.title) throw new Error("Write the article before publishing.");

  const [{ data: siteRow }, { data: client }] = await Promise.all([
    db.from("site_connections").select("*").eq("client_id", article.client_id).maybeSingle(),
    db.from("clients").select("name").eq("id", article.client_id).maybeSingle(),
  ]);
  const site = siteRow as SiteConnection | null;
  if (!site?.repo || !site.content_dir) throw new Error("Connect this client's site first (SEO Studio → Sites): repo and content folder.");
  if (!validRepo(site.repo)) throw new Error("Repo must look like owner/name.");

  const { url, file } = buildArticleFile(article, site, (client?.name as string) ?? "");
  const repo = site.repo;
  const base = site.branch || "main";
  const branch = `contentflow/${file.slug}-${Date.now().toString(36)}`;

  const ref = await gh<{ object: { sha: string } }>(`/repos/${repo}/git/ref/heads/${encodeURIComponent(base)}`);
  await gh(`/repos/${repo}/git/refs`, { method: "POST", body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: ref.object.sha }) });

  // Article file (update in place if it already exists, e.g. a re-publish).
  const filePath = `${cleanDir(site.content_dir)}/${file.slug}.json`;
  let existingSha: string | undefined;
  try {
    existingSha = (await gh<{ sha: string }>(`/repos/${repo}/contents/${encPath(filePath)}?ref=${encodeURIComponent(branch)}`)).sha;
  } catch {
    existingSha = undefined;
  }
  await gh(`/repos/${repo}/contents/${encPath(filePath)}`, {
    method: "PUT",
    body: JSON.stringify({
      message: `${existingSha ? "Update" : "Add"} article: ${file.title}`,
      content: b64(JSON.stringify(file, null, 2) + "\n"),
      branch,
      ...(existingSha ? { sha: existingSha } : {}),
    }),
  });

  if (site.sitemap_path) {
    const sm = await gh<{ sha: string; content: string }>(
      `/repos/${repo}/contents/${encPath(site.sitemap_path.replace(/^\/+/, ""))}?ref=${encodeURIComponent(branch)}`,
    ).catch(() => null);
    if (sm) {
      const xml = Buffer.from(sm.content, "base64").toString("utf8");
      const next = addToSitemap(xml, url, file.dateModified);
      if (next !== xml) {
        await gh(`/repos/${repo}/contents/${encPath(site.sitemap_path.replace(/^\/+/, ""))}`, {
          method: "PUT",
          body: JSON.stringify({ message: `Sitemap: add ${url}`, content: b64(next), branch, sha: sm.sha }),
        });
      }
    }
  }

  const pr = await gh<{ html_url: string }>(`/repos/${repo}/pulls`, {
    method: "POST",
    body: JSON.stringify({
      title: `New article: ${file.title}`,
      head: branch,
      base,
      body: [
        `Adds **${file.title}** at \`${url}\`.`,
        "",
        `- Target keyword: ${article.keyword}`,
        `- Content score: ${article.score ?? "—"}/100`,
        `- Includes Article${file.faq.length ? " + FAQPage" : ""} structured data and internal links.`,
        site.sitemap_path ? "- Adds the URL to the sitemap." : "",
        "",
        "Created by ContentFlow OS SEO Studio. Review, then merge to publish.",
      ]
        .filter((l) => l !== "")
        .join("\n"),
    }),
  });

  await db
    .from("seo_articles")
    .update({ status: "published", pr_url: pr.html_url, published_url: url, published_at: new Date().toISOString(), slug: file.slug })
    .eq("id", articleId);
  return { prUrl: pr.html_url, url };
}
