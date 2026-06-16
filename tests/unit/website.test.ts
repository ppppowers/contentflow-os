import { describe, it, expect } from "vitest";
import { stripHtml, absolutize, discoverInternalLinks, rankRelevantLinks } from "@/lib/website/fetch";
import { websiteAnalysisSchema, type WebsiteAnalysis } from "@/lib/validation/website";

describe("stripHtml", () => {
  it("drops scripts/styles/tags and collapses whitespace", () => {
    const html = `<html><head><style>.x{}</style></head><body><script>bad()</script><h1>Acme  HVAC</h1><p>We fix&nbsp;furnaces.</p></body></html>`;
    expect(stripHtml(html)).toBe("Acme HVAC We fix furnaces.");
  });
});

describe("absolutize", () => {
  it("resolves relative urls and strips hashes", () => {
    expect(absolutize("/about", "https://acme.com/")).toBe("https://acme.com/about");
    expect(absolutize("services#top", "https://acme.com/")).toBe("https://acme.com/services");
  });
  it("rejects non-http protocols", () => {
    expect(absolutize("mailto:x@y.com", "https://acme.com/")).toBeNull();
  });
});

describe("discoverInternalLinks", () => {
  it("keeps same-host links, drops external, dedups", () => {
    const html = `
      <a href="/about">About</a>
      <a href="https://acme.com/services">Services</a>
      <a href="https://facebook.com/acme">FB</a>
      <a href="/about">About again</a>`;
    const links = discoverInternalLinks(html, "https://acme.com/");
    expect(links).toContain("https://acme.com/about");
    expect(links).toContain("https://acme.com/services");
    expect(links).not.toContain("https://facebook.com/acme");
    expect(links.filter((l) => l.endsWith("/about"))).toHaveLength(1);
  });
});

describe("rankRelevantLinks", () => {
  it("keeps only keyword pages, excludes the homepage, ranks by relevance", () => {
    const links = [
      "https://acme.com/",
      "https://acme.com/contact-us",
      "https://acme.com/about",
      "https://acme.com/random",
      "https://acme.com/services",
    ];
    const ranked = rankRelevantLinks(links, "https://acme.com/");
    expect(ranked).not.toContain("https://acme.com/");
    expect(ranked).not.toContain("https://acme.com/random");
    expect(ranked).toContain("https://acme.com/about");
    expect(ranked).toContain("https://acme.com/services");
  });
});

describe("websiteAnalysisSchema", () => {
  const valid: WebsiteAnalysis = {
    brandVoice: "Warm, practical, local.",
    audience: "Homeowners in the metro area.",
    services: ["Furnace repair", "AC install"],
    keywords: ["hvac repair", "furnace replacement"],
    uniqueSellingPoints: ["Same-day service"],
    ideas: {
      newsletters: [{ title: "Beat the winter rush", angle: "Tune-ups before the cold." }],
      blogs: [{ title: "Furnace warning signs", angle: "5 sounds that mean call now." }],
      campaigns: [{ title: "Spring AC ready", angle: "Pre-summer check special." }],
    },
  };
  it("accepts a valid analysis", () => {
    expect(websiteAnalysisSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects unknown keys (strict)", () => {
    expect(websiteAnalysisSchema.safeParse({ ...valid, extra: 1 }).success).toBe(false);
  });
});
