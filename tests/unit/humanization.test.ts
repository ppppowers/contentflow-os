import { describe, it, expect } from "vitest";
import { scanText } from "@/lib/agents/authenticity";
import { AUTHENTICITY_THRESHOLD } from "@/lib/agents/registry";
import { gapAnalysisSchema, type GapAnalysis } from "@/lib/validation/gaps";

describe("Phase 16 — humanization threshold + expanded scanner", () => {
  it("threshold is raised to 95", () => {
    expect(AUTHENTICITY_THRESHOLD).toBe(95);
  });

  it("flags newly added AI tells", () => {
    const r = scanText("This game-changer will supercharge results — let's dive into the power of it.");
    expect(r.flags.length).toBeGreaterThan(0);
    expect(r.score).toBeLessThan(100);
  });

  it("flags predictable generic openings", () => {
    const r = scanText("In this blog, whether you're a beginner or pro, without further ado.");
    expect(r.score).toBeLessThan(100);
  });

  it("leaves clean, specific copy at 100", () => {
    const r = scanText("Dana fixed the Johnson furnace on Saturday. Forty neighbors came to the open house.");
    expect(r.score).toBe(100);
  });
});

describe("Phase 18 — gap analysis schema", () => {
  const valid: GapAnalysis = {
    summary: "Heavy on promos, light on stories.",
    missingTopics: ["maintenance how-tos"],
    untappedServices: ["duct cleaning"],
    overusedContent: ["discount blasts"],
    recommendations: ["Run a customer-story series."],
  };
  it("accepts a valid report", () => expect(gapAnalysisSchema.safeParse(valid).success).toBe(true));
  it("rejects unknown keys (strict)", () => expect(gapAnalysisSchema.safeParse({ ...valid, x: 1 }).success).toBe(false));
});
