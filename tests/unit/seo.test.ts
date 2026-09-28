import { describe, it, expect } from "vitest";
import { scoreArticle } from "@/lib/seo/score";
import { buildJsonLd, slugify } from "@/lib/seo/jsonld";
import { addToSitemap, buildArticleFile } from "@/lib/seo/publish";
import { findDomainPosition, mentionsBrand } from "@/lib/seo/monitor";
import type { Research } from "@/lib/seo/schemas";

const research: Research = {
  searchIntent: "Find software to manage volunteers",
  summary: "",
  competitors: [],
  questions: ["How do you track volunteer hours?", "What does volunteer management software cost?"],
  contentGaps: [],
  keyTerms: [
    { term: "volunteer scheduling", importance: "must" },
    { term: "hour tracking", importance: "should" },
    { term: "background checks", importance: "nice" },
  ],
  recommendedWords: 50,
  outline: [],
};

describe("scoreArticle", () => {
  it("rewards coverage, structure and metadata", () => {
    const body = [
      "## Why it matters",
      "Volunteer scheduling gets messy fast. Hour tracking keeps grant reports honest.",
      "## How to track volunteer hours",
      "Use a check-in kiosk so every volunteer hours entry is logged automatically at the event.",
      "## What volunteer management software costs",
      "Most tools cost between $0 and $300 per month depending on seats; software cost scales with volunteers. Background checks are usually extra.",
    ].join("\n\n");
    const s = scoreArticle({
      keyword: "volunteer management software",
      title: "Volunteer Management Software: A Practical 2026 Guide",
      metaDescription: "x".repeat(140),
      bodyMd: body,
      faq: [1, 2, 3].map((i) => ({ question: `Q${i}`, answer: "A" })),
      research,
    });
    expect(s.missingTerms).toEqual([]);
    expect(s.unansweredQuestions).toEqual([]);
    expect(s.score).toBeGreaterThanOrEqual(90);
  });

  it("flags missing terms and unanswered questions", () => {
    const s = scoreArticle({ keyword: "volunteer management software", title: "Hi", metaDescription: "", bodyMd: "Short.", faq: [], research });
    expect(s.missingTerms).toContain("volunteer scheduling");
    expect(s.unansweredQuestions.length).toBe(2);
    expect(s.score).toBeLessThan(30);
  });
});

describe("buildJsonLd", () => {
  it("emits Article and FAQPage", () => {
    const ld = buildJsonLd({
      url: "https://x.us/resources/a",
      title: "T",
      description: "D",
      publisher: "X",
      siteUrl: "https://x.us",
      datePublished: "2026-09-28",
      faq: [{ question: "Q?", answer: "A." }],
    });
    expect(ld.map((l) => l["@type"])).toEqual(["Article", "FAQPage"]);
  });

  it("omits FAQPage without questions", () => {
    const ld = buildJsonLd({ url: "u", title: "T", description: "D", publisher: "X", siteUrl: "s", datePublished: "d", faq: [] });
    expect(ld).toHaveLength(1);
  });
});

describe("publishing helpers", () => {
  it("slugifies titles", () => {
    expect(slugify("How to Track Volunteer Hours (2026)!")).toBe("how-to-track-volunteer-hours-2026");
  });

  it("adds a sitemap entry once", () => {
    const xml = '<?xml version="1.0"?>\n<urlset>\n  <url><loc>https://x.us/</loc></url>\n</urlset>\n';
    const once = addToSitemap(xml, "https://x.us/resources/a", "2026-09-28");
    expect(once).toContain("<loc>https://x.us/resources/a</loc>");
    expect(addToSitemap(once, "https://x.us/resources/a", "2026-09-28")).toBe(once);
  });

  it("builds the article file with URL, HTML and structured data", () => {
    const { url, file } = buildArticleFile(
      {
        id: "1", agency_id: "a", client_id: "c", keyword: "kw", status: "drafted", research: null, outline: null,
        title: "My Title", slug: "my-title", meta_description: "desc", body_md: "## Hello\n\nWorld", faq: [],
        score: 80, published_url: null, pr_url: null,
      },
      { client_id: "c", site_url: "https://x.us/", repo: "o/r", branch: "main", content_dir: "content", url_prefix: "resources", sitemap_path: null, brand_terms: [] },
      "X",
      new Date("2026-09-28T12:00:00Z"),
    );
    expect(url).toBe("https://x.us/resources/my-title");
    expect(file.html).toContain("<h2>Hello</h2>");
    expect(file.datePublished).toBe("2026-09-28");
    expect(file.jsonLd[0]["@type"]).toBe("Article");
  });
});

describe("monitoring helpers", () => {
  it("finds the domain's position in results", () => {
    const r = [{ url: "https://a.com/x" }, { url: "https://www.volunteerflow.us/resources/y" }];
    expect(findDomainPosition(r, "volunteerflow.us")).toEqual({ position: 2, url: "https://www.volunteerflow.us/resources/y" });
    expect(findDomainPosition(r, "nope.com").position).toBeNull();
  });

  it("detects brand mentions case-insensitively", () => {
    expect(mentionsBrand("Try VolunteerFlow or Galaxy", ["volunteerflow"])).toBe(true);
    expect(mentionsBrand("Try Galaxy", ["VolunteerFlow", "volunteerflow.us"])).toBe(false);
  });
});

import { parseOutline, siteConnectionSchema } from "@/lib/validation/seo";

describe("seo validation", () => {
  it("parses an edited outline", () => {
    expect(parseOutline("## Intro — why it matters\n### Costs - typical pricing\n\n## Wrap up")).toEqual([
      { heading: "Intro", level: 2, notes: "why it matters" },
      { heading: "Costs", level: 3, notes: "typical pricing" },
      { heading: "Wrap up", level: 2, notes: "" },
    ]);
  });

  it("validates site connections", () => {
    expect(siteConnectionSchema.safeParse({ siteUrl: "https://volunteerflow.us", repo: "ppppowers/volunteerflow-project", branch: "main", urlPrefix: "/resources" }).success).toBe(true);
    expect(siteConnectionSchema.safeParse({ siteUrl: "volunteerflow.us", urlPrefix: "/resources" }).success).toBe(false);
    expect(siteConnectionSchema.safeParse({ siteUrl: "https://x.us", repo: "not a repo", urlPrefix: "/r" }).success).toBe(false);
  });
});
