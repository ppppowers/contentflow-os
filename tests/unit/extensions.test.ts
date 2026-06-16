import { describe, it, expect } from "vitest";
import { PROVIDERS, getProvider, isProvider, publishVia } from "@/lib/extensions/registry";

describe("extension provider registry", () => {
  it("registers all spec providers across categories", () => {
    const ids = PROVIDERS.map((p) => p.id);
    for (const id of ["mailchimp", "brevo", "constant_contact", "wordpress", "social_publishing"]) {
      expect(ids).toContain(id);
    }
    expect(PROVIDERS.filter((p) => p.category === "email")).toHaveLength(3);
    expect(getProvider("wordpress")?.category).toBe("cms");
    expect(getProvider("social_publishing")?.category).toBe("social");
  });

  it("isProvider validates ids", () => {
    expect(isProvider("mailchimp")).toBe(true);
    expect(isProvider("nope")).toBe(false);
  });
});

describe("publishVia (framework only)", () => {
  it("returns not-implemented for a known provider", async () => {
    const r = await publishVia("mailchimp", { projectId: "p", channel: "newsletter", body: "x" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/not implemented/i);
  });
  it("rejects an unknown provider", async () => {
    const r = await publishVia("ghost", { projectId: "p", channel: "newsletter", body: "x" });
    expect(r.ok).toBe(false);
  });
});
