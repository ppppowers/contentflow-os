// Website fetching + HTML→text. Plain HTTP (no AI provider). The pure helpers
// (stripHtml, absolutize, discoverInternalLinks, rankRelevantLinks) are unit-tested.

const PAGE_CHAR_BUDGET = 6000;   // per page
const TOTAL_CHAR_BUDGET = 24000; // across all pages sent to Claude
const MAX_EXTRA_PAGES = 4;
const FETCH_TIMEOUT_MS = 10000;

// Prioritize the pages the spec calls out.
const RELEVANT = ["about", "service", "services", "blog", "news", "event", "events", "pricing", "what-we-do"];

export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function absolutize(href: string, base: string): string | null {
  try {
    const u = new URL(href, base);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    u.hash = "";
    return u.toString();
  } catch {
    return null;
  }
}

// Same-host internal links, deduped, absolute.
export function discoverInternalLinks(html: string, baseUrl: string): string[] {
  let baseHost: string;
  try {
    baseHost = new URL(baseUrl).host;
  } catch {
    return [];
  }
  const out = new Set<string>();
  for (const m of html.matchAll(/href\s*=\s*["']([^"']+)["']/gi)) {
    const abs = absolutize(m[1], baseUrl);
    if (!abs) continue;
    try {
      if (new URL(abs).host === baseHost) out.add(abs);
    } catch {
      /* skip */
    }
  }
  return [...out];
}

// Rank by relevance keyword in the path; drop the homepage itself.
export function rankRelevantLinks(links: string[], baseUrl: string): string[] {
  const base = absolutize(baseUrl, baseUrl);
  const scored = links
    .filter((l) => l !== base)
    .map((l) => {
      const path = (() => {
        try {
          return new URL(l).pathname.toLowerCase();
        } catch {
          return "";
        }
      })();
      const score = RELEVANT.reduce((s, kw) => (path.includes(kw) ? s + 1 : s), 0);
      return { l, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.map((x) => x.l);
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "ContentFlowOS-WebsiteIntelligence/1.0" },
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("text/html")) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export type SiteText = { pages: string[]; text: string };

// Fetch homepage + top relevant internal pages → labeled, budgeted text block.
export async function fetchSiteText(url: string): Promise<SiteText | null> {
  const home = await fetchText(url);
  if (home === null) return null;

  const targets = rankRelevantLinks(discoverInternalLinks(home, url), url).slice(0, MAX_EXTRA_PAGES);

  const sections: string[] = [`# ${url}\n${stripHtml(home).slice(0, PAGE_CHAR_BUDGET)}`];
  const fetched = [url];
  for (const t of targets) {
    const html = await fetchText(t);
    if (html === null) continue;
    sections.push(`# ${t}\n${stripHtml(html).slice(0, PAGE_CHAR_BUDGET)}`);
    fetched.push(t);
  }

  return { pages: fetched, text: sections.join("\n\n").slice(0, TOTAL_CHAR_BUDGET) };
}
