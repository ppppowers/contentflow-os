import { describe, it, expect } from "vitest";
import { intelligenceBriefSchema, countExtracted, type IntelligenceBrief } from "@/lib/validation/interview";

const sample: IntelligenceBrief = {
  summary: "Strong month — a customer win and a spring promo to build around.",
  readinessScore: 78,
  extracted: {
    stories: [{ title: "Smith install", detail: "Replaced a 20-year furnace in one day." }],
    promotions: [{ title: "Spring tune-up", detail: "$89 through May 31." }],
    events: [],
    customerWins: [{ title: "5-star review", detail: "Family of four, no heat, fixed same day." }],
    teamAchievements: [],
  },
  gaps: ["No photos of the install.", "Promo redemption steps unclear."],
  followUpQuestions: [
    { question: "Can we get a before/after photo of the Smith furnace?", why: "Visual proof lifts the story." },
  ],
};

describe("intelligenceBriefSchema", () => {
  it("accepts a well-formed brief", () => {
    expect(intelligenceBriefSchema.safeParse(sample).success).toBe(true);
  });

  it("rejects an out-of-range readiness score", () => {
    expect(intelligenceBriefSchema.safeParse({ ...sample, readinessScore: 130 }).success).toBe(false);
  });

  it("rejects unknown top-level keys (strict)", () => {
    expect(intelligenceBriefSchema.safeParse({ ...sample, extra: true }).success).toBe(false);
  });
});

describe("countExtracted", () => {
  it("sums opportunities across all five categories", () => {
    expect(countExtracted(sample)).toBe(3);
  });

  it("is zero for an empty extraction", () => {
    const empty = { ...sample, extracted: { stories: [], promotions: [], events: [], customerWins: [], teamAchievements: [] } };
    expect(countExtracted(empty)).toBe(0);
  });
});
