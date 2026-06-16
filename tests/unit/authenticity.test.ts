import { describe, it, expect } from "vitest";
import { scanText, scanEditorOutput, buildRewriteFeedback } from "@/lib/agents/authenticity";

describe("scanText", () => {
  it("scores clean copy at 100", () => {
    const r = scanText("Dana baked bread for the volunteer dinner on Saturday. Forty people came.");
    expect(r.score).toBe(100);
    expect(r.flags).toHaveLength(0);
  });

  it("flags banned phrases and deducts", () => {
    const r = scanText("We leverage synergy to transform your business.");
    expect(r.score).toBeLessThan(100);
    const phrases = r.flags.map((f) => f.phrase);
    expect(phrases).toContain("leverage");
    expect(phrases).toContain("transform");
  });

  it("flags generic intros via regex", () => {
    const r = scanText("In today's fast-paced world, we are thrilled to announce our new program.");
    expect(r.flags.some((f) => f.kind === "generic")).toBe(true);
    expect(r.score).toBeLessThan(90);
  });

  it("caps repeat contribution at 3", () => {
    const many = scanText("leverage ".repeat(10));
    const once = scanText("leverage");
    // 10 occurrences capped at 3× weight, not 10×.
    expect(many.deductions).toBe(once.flags[0].weight * 3);
  });

  it("merges extra (brand) banned phrases", () => {
    const r = scanText("Our widgets are amazing.", ["widgets"]);
    expect(r.flags.some((f) => f.phrase === "widgets")).toBe(true);
  });

  it("never goes below 0", () => {
    const r = scanText("leverage transform elevate revolutionary cutting-edge moreover furthermore ".repeat(20));
    expect(r.score).toBe(0);
  });
});

describe("scanEditorOutput", () => {
  it("scans all humanized drafts as one corpus", () => {
    const r = scanEditorOutput({
      humanizedNewsletter: "A clean newsletter.",
      humanizedBlog: "A clean blog.",
      humanizedSocial: { facebook: "We leverage growth.", linkedin: "", instagram: "", sms: "" },
    });
    expect(r.flags.some((f) => f.phrase === "leverage")).toBe(true);
  });
});

describe("buildRewriteFeedback", () => {
  it("returns empty string with no flags", () => {
    expect(buildRewriteFeedback([])).toBe("");
  });
  it("lists flagged phrases for the rewrite pass", () => {
    const fb = buildRewriteFeedback([{ phrase: "leverage", kind: "banned", count: 2, weight: 7 }]);
    expect(fb).toContain("leverage");
    expect(fb).toMatch(/REWRITE REQUIRED/);
  });
});
