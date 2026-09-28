import type { FaqItem } from "./schemas";

// Structured data for search engines and AI answer engines: Article + FAQPage.
export function buildJsonLd(a: {
  url: string;
  title: string;
  description: string;
  publisher: string;
  siteUrl: string;
  datePublished: string;
  dateModified?: string;
  faq: FaqItem[];
}): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: a.title,
      description: a.description,
      mainEntityOfPage: { "@type": "WebPage", "@id": a.url },
      datePublished: a.datePublished,
      dateModified: a.dateModified ?? a.datePublished,
      author: { "@type": "Organization", name: a.publisher, url: a.siteUrl },
      publisher: { "@type": "Organization", name: a.publisher, url: a.siteUrl },
    },
  ];
  if (a.faq.length > 0) {
    out.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: a.faq.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    });
  }
  return out;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}
