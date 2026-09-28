// Pages on the client's site, used to suggest internal links. Plain HTTP only.
export async function fetchSitemapUrls(siteUrl: string, limit = 200): Promise<string[]> {
  const base = siteUrl.replace(/\/+$/, "");
  try {
    const res = await fetch(`${base}/sitemap.xml`, {
      headers: { "User-Agent": "ContentFlowOS/1.0 (+sitemap)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const urls = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
    return [...new Set(urls)].slice(0, limit);
  } catch {
    return [];
  }
}
