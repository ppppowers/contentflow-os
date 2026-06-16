import { describe, it, expect } from "vitest";
import { countNumbers, countDates, countQuotes, countProperNouns, evidenceScore } from "@/lib/evidence/score";

describe("evidence signal counters", () => {
  it("counts numbers, currency, percentages", () => {
    expect(countNumbers("We raised $4,200 — up 18% from 12 donors.")).toBeGreaterThanOrEqual(3);
  });
  it("counts dates (months, weekdays, years)", () => {
    expect(countDates("On Saturday in March 2026 we opened.")).toBe(3);
  });
  it("counts quote pairs", () => {
    expect(countQuotes(`She said "it changed everything" to us.`)).toBe(1);
  });
  it("counts mid-sentence proper nouns", () => {
    expect(countProperNouns("Our tech Dana fixed the Johnson furnace.")).toBeGreaterThanOrEqual(2);
  });
});

describe("evidenceScore", () => {
  it("scores vague copy low with all suggestions", () => {
    const r = evidenceScore("We help people with great service every day.");
    expect(r.score).toBeLessThan(30);
    expect(r.suggestions.length).toBeGreaterThan(0);
  });
  it("scores specific copy high", () => {
    const r = evidenceScore(`On Saturday, Dana and the Maple Street team served 142 neighbors and raised $4,200. "Best night yet," said volunteer Carlos.`);
    expect(r.score).toBeGreaterThan(60);
  });
  it("is monotonic — adding specifics never lowers the score", () => {
    const a = evidenceScore("We had a good month.").score;
    const b = evidenceScore("We had a good month: 312 visits, up 9% from March.").score;
    expect(b).toBeGreaterThanOrEqual(a);
  });
});
