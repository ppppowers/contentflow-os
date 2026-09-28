import { Marked } from "marked";

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

// Only web and relative links survive; javascript:, data:, etc. are dropped.
function safeHref(href: string): string | null {
  const h = href.trim();
  if (/^(https?:)?\/\//i.test(h) || h.startsWith("/") || h.startsWith("#") || /^mailto:/i.test(h)) return h;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(h)) return h; // relative path like "pricing"
  return null;
}

// Markdown → HTML for publishing. Raw HTML in the source is escaped (never
// rendered), so the output is safe to inject into a page.
const md = new Marked({
  gfm: true,
  renderer: {
    html({ text }) {
      return escapeHtml(text);
    },
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      const safe = safeHref(href);
      if (!safe) return text;
      const external = /^(https?:)?\/\//i.test(safe);
      return `<a href="${escapeHtml(safe)}"${title ? ` title="${escapeHtml(title)}"` : ""}${
        external ? ' rel="noopener"' : ""
      }>${text}</a>`;
    },
    image({ href, title, text }) {
      const safe = safeHref(href);
      if (!safe) return escapeHtml(text);
      return `<img src="${escapeHtml(safe)}" alt="${escapeHtml(text)}"${title ? ` title="${escapeHtml(title)}"` : ""} loading="lazy" />`;
    },
  },
});

export function markdownToHtml(markdown: string): string {
  return md.parse(markdown, { async: false }) as string;
}
