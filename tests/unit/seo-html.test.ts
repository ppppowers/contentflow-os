import { describe, it, expect } from "vitest";
import { markdownToHtml } from "@/lib/seo/html";

describe("markdownToHtml", () => {
  it("renders headings, lists and links", () => {
    const html = markdownToHtml("## Hi\n\n- one\n- two\n\nSee [pricing](/pricing).");
    expect(html).toContain("<h2>Hi</h2>");
    expect(html).toContain("<li>one</li>");
    expect(html).toContain('<a href="/pricing">pricing</a>');
  });

  it("escapes raw HTML instead of rendering it", () => {
    const html = markdownToHtml('Hello <script>alert(1)</script> <img src=x onerror="alert(1)">');
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;script&gt;");
  });

  it("drops javascript: links but keeps the text", () => {
    const html = markdownToHtml("[click](javascript:alert(1))");
    expect(html).not.toContain("javascript:");
    expect(html).toContain("click");
  });

  it("marks external links noopener", () => {
    expect(markdownToHtml("[x](https://example.com)")).toContain('rel="noopener"');
  });
});
