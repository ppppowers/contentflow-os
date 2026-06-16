import { describe, it, expect } from "vitest";
import { minedStoriesSchema, normalizeTitle, storyFormSchema } from "@/lib/validation/story";

describe("normalizeTitle", () => {
  it("lowercases and collapses punctuation for dedup", () => {
    expect(normalizeTitle("Smith Family — Furnace Install!")).toBe("smith family furnace install");
    expect(normalizeTitle("smith family  furnace install")).toBe("smith family furnace install");
  });
});

describe("minedStoriesSchema", () => {
  it("accepts a well-formed mined batch", () => {
    const ok = {
      stories: [
        { category: "customer", title: "Smith install", summary: "One-day swap.", detail: "20-year furnace.", tags: ["hvac", "winter"] },
        { category: "donor", title: "Major gift", summary: "Funded the van.", detail: "$10k anonymous.", tags: ["fundraising"] },
      ],
    };
    expect(minedStoriesSchema.safeParse(ok).success).toBe(true);
  });

  it("rejects an invalid category", () => {
    const bad = { stories: [{ category: "supplier", title: "x", summary: "", detail: "", tags: [] }] };
    expect(minedStoriesSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects unknown keys (strict)", () => {
    const bad = { stories: [], extra: true };
    expect(minedStoriesSchema.safeParse(bad).success).toBe(false);
  });
});

describe("storyFormSchema", () => {
  it("parses tags from a comma string and requires a title", () => {
    const r = storyFormSchema.safeParse({ category: "volunteer", title: "Maria", tags: "spotlight, weekly , " });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.tags).toEqual(["spotlight", "weekly"]);
  });

  it("rejects a too-short title", () => {
    expect(storyFormSchema.safeParse({ category: "customer", title: "x" }).success).toBe(false);
  });
});
