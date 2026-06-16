import { describe, it, expect } from "vitest";
import { agencyPatternsText, summarizeStats, type AgencyBrainEntry } from "@/lib/agency-brain/retrieval";

function entry(p: Partial<AgencyBrainEntry>): AgencyBrainEntry {
  return {
    id: "x",
    category: "subject_line",
    content: "c",
    authenticity_score: null,
    times_used: 0,
    is_active: true,
    source_project_id: null,
    created_at: "2026-01-01",
    ...p,
  };
}

describe("agencyPatternsText", () => {
  it("returns empty string when there are no patterns", () => {
    expect(agencyPatternsText([], [])).toBe("");
  });

  it("renders subject lines and CTAs under labeled headers", () => {
    const out = agencyPatternsText(["Doors open at 6", "Two seats left"], ["Reply to reserve"]);
    expect(out).toContain("Proven subject-line shapes:");
    expect(out).toContain("- Doors open at 6");
    expect(out).toContain("Proven CTA shapes:");
    expect(out).toContain("- Reply to reserve");
  });

  it("omits a section that has no entries", () => {
    const out = agencyPatternsText(["Only subject"], []);
    expect(out).toContain("subject-line");
    expect(out).not.toContain("CTA");
  });
});

describe("summarizeStats", () => {
  it("counts active entries per category and reports the top score", () => {
    const stats = summarizeStats([
      entry({ category: "subject_line", authenticity_score: 92 }),
      entry({ category: "subject_line", authenticity_score: 88 }),
      entry({ category: "cta", authenticity_score: 95 }),
      entry({ category: "cta", is_active: false, authenticity_score: 99 }), // excluded
    ]);
    const subj = stats.find((s) => s.category === "subject_line")!;
    const cta = stats.find((s) => s.category === "cta")!;
    expect(subj.count).toBe(2);
    expect(subj.topScore).toBe(92);
    expect(cta.count).toBe(1);
    expect(cta.topScore).toBe(95); // inactive 99 ignored
  });

  it("returns a row for every category, null top score when empty", () => {
    const stats = summarizeStats([]);
    expect(stats).toHaveLength(5);
    expect(stats.every((s) => s.count === 0 && s.topScore === null)).toBe(true);
  });
});
