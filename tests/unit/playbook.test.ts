import { describe, it, expect } from "vitest";
import { INDUSTRIES, playbookSchema, type Playbook } from "@/lib/validation/playbook";

describe("INDUSTRIES", () => {
  it("covers all 11 spec industries", () => {
    expect(INDUSTRIES).toHaveLength(11);
    for (const i of ["Nonprofits", "Churches", "HVAC", "Plumbing", "Electrical", "Auto Repair", "Contractors", "Landscaping", "Law Firms", "Medical Offices", "SaaS"]) {
      expect(INDUSTRIES).toContain(i);
    }
  });
});

describe("playbookSchema", () => {
  const valid: Playbook = {
    campaignIdeas: ["Seasonal maintenance reminders"],
    topicLibrary: ["How to spot a failing water heater"],
    seasonalContent: [{ when: "Spring", idea: "AC tune-up push" }],
    subjectLines: ["Beat the summer rush"],
    ctas: ["Book a free estimate"],
  };
  it("accepts a valid playbook", () => {
    expect(playbookSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects unknown keys (strict)", () => {
    expect(playbookSchema.safeParse({ ...valid, extra: 1 }).success).toBe(false);
  });
  it("rejects malformed seasonal entries", () => {
    expect(playbookSchema.safeParse({ ...valid, seasonalContent: [{ when: "Spring" }] }).success).toBe(false);
  });
});
