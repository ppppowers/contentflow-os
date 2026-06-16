import { describe, it, expect } from "vitest";
import { voiceProfileSchema, type VoiceProfile } from "@/lib/validation/voice-profile";

describe("voiceProfileSchema", () => {
  const valid: VoiceProfile = {
    summary: "Warm, plain-spoken, community-minded.",
    vocabulary: ["neighbors", "on time", "no surprises"],
    tone: "friendly",
    personality: "dependable local pro",
    formality: "casual but respectful",
    ctaStyle: "direct, low-pressure",
    doList: ["Use first names", "Lead with the customer"],
    dontList: ["Corporate jargon", "Hype"],
  };
  it("accepts a valid profile", () => {
    expect(voiceProfileSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects missing required fields", () => {
    const { tone, ...rest } = valid;
    expect(voiceProfileSchema.safeParse(rest).success).toBe(false);
  });
  it("rejects unknown keys (strict)", () => {
    expect(voiceProfileSchema.safeParse({ ...valid, extra: true }).success).toBe(false);
  });
});
