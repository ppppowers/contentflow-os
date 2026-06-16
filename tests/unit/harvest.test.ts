import { describe, it, expect } from "vitest";
import { HARVEST_CARDS } from "@/lib/harvest/cards";
import { INTAKE_TYPES } from "@/lib/validation/intake";

describe("HARVEST_CARDS", () => {
  it("covers the seven spec cards plus a quick update", () => {
    const keys = HARVEST_CARDS.map((c) => c.key);
    for (const k of [
      "customer_story", "project_complete", "new_employee", "upcoming_event",
      "promotion", "volunteer_spotlight", "donor_story",
    ]) {
      expect(keys).toContain(k);
    }
    expect(keys).toContain("quick_update");
  });

  it("maps every card to a valid intake type", () => {
    for (const card of HARVEST_CARDS) {
      expect(INTAKE_TYPES).toContain(card.intakeType);
    }
  });

  it("has unique keys and a non-empty prompt + icon per card", () => {
    const keys = HARVEST_CARDS.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const card of HARVEST_CARDS) {
      expect(card.prompt.length).toBeGreaterThan(0);
      expect(card.icon.length).toBeGreaterThan(0);
    }
  });

  it("includes the three new intake types added for harvesting", () => {
    for (const t of ["project_complete", "team_update", "donor_story"]) {
      expect(INTAKE_TYPES).toContain(t);
    }
  });
});
