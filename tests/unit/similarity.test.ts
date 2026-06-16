import { describe, it, expect } from "vitest";
import { tokenize, jaccard, similarity, daysBetween, findSimilar, type HistoryItem } from "@/lib/memory/similarity";

describe("tokenize", () => {
  it("lowercases, splits, drops stopwords and short tokens", () => {
    expect(tokenize("The Spring HVAC Tune-Up is ON")).toEqual(["spring", "hvac", "tune"]);
  });
});

describe("jaccard", () => {
  it("is 1 for identical sets, 0 for disjoint", () => {
    expect(jaccard(new Set(["a", "b"]), new Set(["a", "b"]))).toBe(1);
    expect(jaccard(new Set(["a"]), new Set(["b"]))).toBe(0);
  });
});

describe("similarity", () => {
  it("scores identical topics at 100", () => {
    expect(similarity("Spring furnace tune-up special", "Spring furnace tune-up special")).toBe(100);
  });
  it("scores unrelated topics low", () => {
    expect(similarity("Spring furnace tune-up", "Holiday food drive volunteers")).toBeLessThan(20);
  });
  it("scores overlapping topics in between", () => {
    const s = similarity("Spring furnace tune-up special offer", "Spring AC tune-up reminder");
    expect(s).toBeGreaterThan(20);
    expect(s).toBeLessThan(100);
  });
});

describe("daysBetween", () => {
  it("counts whole days back from now", () => {
    const now = new Date("2026-06-15T00:00:00Z");
    expect(daysBetween("2026-05-14T00:00:00Z", now)).toBe(32);
  });
  it("never goes negative", () => {
    const now = new Date("2026-06-15T00:00:00Z");
    expect(daysBetween("2026-06-20T00:00:00Z", now)).toBe(0);
  });
});

describe("findSimilar", () => {
  const now = new Date("2026-06-15T00:00:00Z");
  const history: HistoryItem[] = [
    { projectId: "p1", title: "Spring Tune-Up Promo", topicText: "Spring furnace tune-up special offer save money", date: "2026-05-14T00:00:00Z" },
    { projectId: "p2", title: "Food Drive", topicText: "Holiday canned food drive for the shelter volunteers", date: "2026-01-01T00:00:00Z" },
  ];

  it("returns matches above threshold with a 'X days ago' message", () => {
    const out = findSimilar("Spring furnace tune-up reminder offer", history, { now, threshold: 20 });
    expect(out.length).toBe(1);
    expect(out[0].projectId).toBe("p1");
    expect(out[0].message).toContain("32 days ago");
  });

  it("returns nothing when no past topic clears the threshold", () => {
    const out = findSimilar("Brand new topic about electric vehicles", history, { now, threshold: 30 });
    expect(out).toEqual([]);
  });

  it("ranks by score and caps at limit", () => {
    const out = findSimilar("spring food tune-up drive", history, { now, threshold: 1, limit: 1 });
    expect(out.length).toBe(1);
  });
});
