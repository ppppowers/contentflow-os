import { describe, it, expect } from "vitest";
import { brainContextText, type BrainEntry } from "@/lib/brain/retrieval";

function entry(p: Partial<BrainEntry>): BrainEntry {
  return {
    id: "x",
    category: "key_fact",
    title: "t",
    body: "",
    data: {},
    priority: 0,
    source: "manual",
    is_active: true,
    created_at: "2026-01-01",
    ...p,
  };
}

describe("brainContextText", () => {
  it("returns empty string for an empty Brain", () => {
    expect(brainContextText([])).toBe("");
  });

  it("groups entries under labeled category headers", () => {
    const out = brainContextText([
      entry({ category: "service", title: "Furnace repair", body: "24/7 emergency" }),
      entry({ category: "promotion", title: "Spring tune-up", body: "$89 through May" }),
    ]);
    expect(out).toContain("## Services");
    expect(out).toContain("- Furnace repair — 24/7 emergency");
    expect(out).toContain("## Promotions");
    expect(out).toContain("- Spring tune-up — $89 through May");
  });

  it("renders a bare title when there is no body", () => {
    const out = brainContextText([entry({ category: "product", title: "Smart thermostat" })]);
    expect(out).toContain("- Smart thermostat");
    expect(out).not.toContain("— ");
  });

  it("keeps multiple entries within the same category together", () => {
    const out = brainContextText([
      entry({ category: "event", title: "Open house" }),
      entry({ category: "event", title: "Food drive" }),
    ]);
    expect((out.match(/## Events/g) ?? []).length).toBe(1);
    expect(out).toContain("- Open house");
    expect(out).toContain("- Food drive");
  });
});
