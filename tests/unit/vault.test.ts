import { describe, it, expect } from "vitest";
import { buildVaultContextText, type VaultDoc } from "@/lib/vault/retrieval";
import { tagsField } from "@/lib/validation/vault";

function doc(p: Partial<VaultDoc>): VaultDoc {
  return { id: "x", client_id: null, title: "t", doc_type: "pdf", summary: "", tags: [], analyzed: true, ...p };
}

describe("buildVaultContextText", () => {
  it("returns empty string with no docs", () => {
    expect(buildVaultContextText([])).toBe("");
  });

  it("renders type, title, summary and tags", () => {
    const out = buildVaultContextText([
      doc({ doc_type: "brand_guide", title: "Voice & Tone", summary: "Warm, plain language", tags: ["voice", "tone"] }),
    ]);
    expect(out).toContain("(brand_guide) Voice & Tone");
    expect(out).toContain("— Warm, plain language");
    expect(out).toContain("[voice, tone]");
  });

  it("omits summary/tags when absent", () => {
    const out = buildVaultContextText([doc({ doc_type: "logo", title: "Primary logo" })]);
    expect(out).toBe("- (logo) Primary logo");
  });
});

describe("tagsField", () => {
  it("splits, trims, lowercases, drops empties", () => {
    expect(tagsField.parse("Spring, HVAC ,, promo ")).toEqual(["spring", "hvac", "promo"]);
  });
  it("handles undefined", () => {
    expect(tagsField.parse(undefined)).toEqual([]);
  });
});
