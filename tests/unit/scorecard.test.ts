import { describe, it, expect } from "vitest";
import { readabilityScore, composeOverall, SCORECARD_DIMENSIONS, SCORECARD_TARGET } from "@/lib/validation/scorecard";

describe("readabilityScore", () => {
  it("returns 0 for empty", () => expect(readabilityScore("")).toBe(0));
  it("scores a simple sentence as highly readable", () => {
    expect(readabilityScore("The cat sat on the mat. It was a warm day.")).toBeGreaterThan(70);
  });
  it("scores dense, long-worded prose lower than simple prose", () => {
    const simple = readabilityScore("We fixed the heater today. The family is warm now.");
    const dense = readabilityScore("Subsequently, the multifaceted infrastructure necessitated comprehensive reconfiguration.");
    expect(dense).toBeLessThan(simple);
  });
  it("stays within 0-100", () => {
    const s = readabilityScore("Antidisestablishmentarianism characterizes the philosophical underpinnings.");
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(100);
  });
});

describe("composeOverall", () => {
  const full = (v: number) => Object.fromEntries(SCORECARD_DIMENSIONS.map((d) => [d, v])) as Record<(typeof SCORECARD_DIMENSIONS)[number], number>;
  it("averages dimensions and passes at the 95 target", () => {
    const r = composeOverall(full(96));
    expect(r.overall).toBe(96);
    expect(r.passed).toBe(true);
  });
  it("fails below target", () => {
    const r = composeOverall(full(80));
    expect(r.passed).toBe(false);
    expect(SCORECARD_TARGET).toBe(95);
  });
});
