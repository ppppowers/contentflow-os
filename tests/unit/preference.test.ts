import { describe, it, expect } from "vitest";
import { preferenceProfileSchema, medianDays, preferenceContextText, type PreferenceProfile } from "@/lib/validation/preference";

describe("medianDays", () => {
  it("returns null for empty", () => expect(medianDays([])).toBeNull());
  it("odd-length median", () => expect(medianDays([1, 5, 3])).toBe(3));
  it("even-length median averages the middle two", () => expect(medianDays([2, 4, 6, 8])).toBe(5));
});

describe("preferenceContextText", () => {
  it("is empty for null", () => expect(preferenceContextText(null)).toBe(""));
  it("renders prefers/avoid/tone lines", () => {
    const p: PreferenceProfile = {
      summary: "", preferences: ["short paragraphs"], avoid: ["exclamation marks"],
      commonRequests: [], toneAdjustments: ["warmer"],
    };
    const out = preferenceContextText(p);
    expect(out).toContain("Prefers: short paragraphs");
    expect(out).toContain("Avoid: exclamation marks");
    expect(out).toContain("Tone: warmer");
  });
});

describe("preferenceProfileSchema", () => {
  it("rejects unknown keys (strict)", () => {
    const base = { summary: "", preferences: [], avoid: [], commonRequests: [], toneAdjustments: [] };
    expect(preferenceProfileSchema.safeParse(base).success).toBe(true);
    expect(preferenceProfileSchema.safeParse({ ...base, x: 1 }).success).toBe(false);
  });
});
