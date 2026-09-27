import { describe, it, expect } from "vitest";
import { quickCreateSchema, weekLabel } from "@/lib/validation/create";

const brief = "Launching free content audits in October, plus the Oct 15 webinar.";

describe("quickCreateSchema", () => {
  it("accepts an existing client with a brief", () => {
    const r = quickCreateSchema.safeParse({ clientId: "abc", brief, images: "on" });
    expect(r.success && r.data.images).toBe(true);
  });

  it("treats a missing checkbox as no images", () => {
    const r = quickCreateSchema.safeParse({ clientId: "abc", brief });
    expect(r.success && r.data.images).toBe(false);
  });

  it("requires a name for a new client", () => {
    const r = quickCreateSchema.safeParse({ clientId: "new", brief, newClientName: "" });
    expect(r.success).toBe(false);
  });

  it("rejects a too-short brief", () => {
    expect(quickCreateSchema.safeParse({ clientId: "abc", brief: "hi" }).success).toBe(false);
  });

  it("rejects a website without a scheme", () => {
    const r = quickCreateSchema.safeParse({ clientId: "new", brief, newClientName: "Acme", newClientWebsite: "acme.com" });
    expect(r.success).toBe(false);
  });
});

describe("weekLabel", () => {
  it("labels by the Monday of the week", () => {
    expect(weekLabel(new Date(2026, 8, 27))).toBe("Week of Sep 28"); // Sunday → coming week
    expect(weekLabel(new Date(2026, 8, 26))).toBe("Week of Sep 28"); // Saturday → coming week
    expect(weekLabel(new Date(2026, 8, 28))).toBe("Week of Sep 28"); // Monday
    expect(weekLabel(new Date(2026, 8, 30))).toBe("Week of Sep 28"); // Wednesday
  });
});
