// Pure renderers for the delivery package. No I/O — used by the export route and
// the printable page. PDF is produced via the browser's print-to-PDF on the
// printable page (keeps the bundle free of a headless-browser/PDF dependency).

export type ExportPiece = {
  channel: string;
  body: string;
  metadata: Record<string, unknown>;
};

const CHANNEL_LABEL: Record<string, string> = {
  newsletter: "Newsletter",
  blog: "Blog",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  sms: "SMS",
  website_announcement: "Website announcement",
};

function arr(v: unknown): string[] {
  return Array.isArray(v) ? (v as string[]) : [];
}

export function buildMarkdown(title: string, pieces: ExportPiece[]): string {
  const out: string[] = [`# ${title}`, ""];
  for (const p of pieces) {
    out.push(`## ${CHANNEL_LABEL[p.channel] ?? p.channel}`, "");
    const m = p.metadata ?? {};
    if (p.channel === "newsletter") {
      const subs = arr(m.subjectLines);
      if (subs.length) out.push(`**Subject options:** ${subs.join(" · ")}`);
      if (m.previewText) out.push(`**Preview:** ${m.previewText}`);
      out.push("");
    }
    if (p.channel === "blog") {
      if (m.seoTitle) out.push(`**SEO title:** ${m.seoTitle}`);
      if (m.metaDescription) out.push(`**Meta:** ${m.metaDescription}`);
      if (m.slug) out.push(`**Slug:** ${m.slug}`);
      const kw = arr(m.keywords);
      if (kw.length) out.push(`**Keywords:** ${kw.join(", ")}`);
      out.push("");
    }
    out.push(p.body || "—", "");
  }
  return out.join("\n");
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function buildHtml(title: string, pieces: ExportPiece[]): string {
  const sections = pieces
    .map((p) => {
      const m = p.metadata ?? {};
      const metaBits: string[] = [];
      if (p.channel === "newsletter") {
        const subs = arr(m.subjectLines);
        if (subs.length) metaBits.push(`<p class="meta"><strong>Subject options:</strong> ${esc(subs.join(" · "))}</p>`);
        if (m.previewText) metaBits.push(`<p class="meta"><strong>Preview:</strong> ${esc(String(m.previewText))}</p>`);
      }
      if (p.channel === "blog") {
        if (m.seoTitle) metaBits.push(`<p class="meta"><strong>SEO title:</strong> ${esc(String(m.seoTitle))}</p>`);
        if (m.metaDescription) metaBits.push(`<p class="meta"><strong>Meta:</strong> ${esc(String(m.metaDescription))}</p>`);
        if (m.slug) metaBits.push(`<p class="meta"><strong>Slug:</strong> ${esc(String(m.slug))}</p>`);
        const kw = arr(m.keywords);
        if (kw.length) metaBits.push(`<p class="meta"><strong>Keywords:</strong> ${esc(kw.join(", "))}</p>`);
      }
      return `<section>
  <h2>${esc(CHANNEL_LABEL[p.channel] ?? p.channel)}</h2>
  ${metaBits.join("\n  ")}
  <div class="body">${esc(p.body || "—").replace(/\n/g, "<br>")}</div>
</section>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>
  body { font: 16px/1.6 -apple-system, Segoe UI, Roboto, sans-serif; color: #1a1a1a; max-width: 720px; margin: 2rem auto; padding: 0 1rem; }
  h1 { font-size: 1.6rem; }
  h2 { font-size: 1.1rem; margin-top: 2rem; border-bottom: 1px solid #eee; padding-bottom: .25rem; }
  .meta { color: #666; font-size: .85rem; margin: .15rem 0; }
  .body { margin-top: .5rem; white-space: pre-wrap; }
  @media print { body { margin: 0; } }
</style>
</head>
<body>
<h1>${esc(title)}</h1>
${sections}
</body>
</html>`;
}
