import { describe, it, expect } from "vitest";
import { contentRoadmapSchema, groupByWeek, isHorizon, type Recommendation } from "@/lib/validation/strategy";

describe("isHorizon", () => {
  it("accepts 30/60/90 only", () => {
    expect(isHorizon(30)).toBe(true);
    expect(isHorizon(90)).toBe(true);
    expect(isHorizon(45)).toBe(false);
  });
});

describe("contentRoadmapSchema", () => {
  const valid = {
    summary: "Build around the spring promo and two customer stories.",
    recommendations: [
      { type: "newsletter", title: "Spring kickoff", angle: "Lead with the Smith story.", suggestedWeek: 1, rationale: "Fresh win." },
      { type: "promotion", title: "Tune-up special", angle: "$89 through May.", suggestedWeek: 2, rationale: "Seasonal." },
    ],
  };
  it("accepts a valid roadmap", () => {
    expect(contentRoadmapSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects an invalid recommendation type", () => {
    const bad = { ...valid, recommendations: [{ ...valid.recommendations[0], type: "podcast" }] };
    expect(contentRoadmapSchema.safeParse(bad).success).toBe(false);
  });
  it("rejects week out of range", () => {
    const bad = { ...valid, recommendations: [{ ...valid.recommendations[0], suggestedWeek: 20 }] };
    expect(contentRoadmapSchema.safeParse(bad).success).toBe(false);
  });
});

describe("groupByWeek", () => {
  const recs: Recommendation[] = [
    { type: "newsletter", title: "A", angle: "", suggestedWeek: 1, rationale: "" },
    { type: "blog", title: "B", angle: "", suggestedWeek: 3, rationale: "" },
    { type: "campaign", title: "C", angle: "", suggestedWeek: 1, rationale: "" },
  ];
  it("groups by week, omits empty weeks, preserves order", () => {
    const g = groupByWeek(recs, 4);
    expect(g.map((x) => x.week)).toEqual([1, 3]);
    expect(g[0].items.map((i) => i.title)).toEqual(["A", "C"]);
  });
});
