import { describe, it, expect } from "vitest";
import { chatGptImagePrompt } from "@/lib/images/channels";
import { OpenAIImageError } from "@/lib/images/openai";

describe("chatGptImagePrompt", () => {
  it("adds channel, aspect ratio and no-text guidance", () => {
    const out = chatGptImagePrompt("instagram", "A sunny cafe counter.");
    expect(out).toContain("Instagram post");
    expect(out).toContain("square (1:1)");
    expect(out).toContain("Don't include any text");
    expect(out.endsWith("A sunny cafe counter.")).toBe(true);
  });

  it("uses landscape for LinkedIn and the newsletter", () => {
    expect(chatGptImagePrompt("linkedin", "x")).toContain("landscape (3:2)");
    expect(chatGptImagePrompt("newsletter", "x")).toContain("newsletter header");
  });
});

describe("OpenAIImageError.isBilling", () => {
  it("recognises out-of-credits errors", () => {
    expect(new OpenAIImageError("You exceeded your current quota", 429, "insufficient_quota").isBilling).toBe(true);
    expect(new OpenAIImageError("Billing hard limit has been reached", 400, "billing_hard_limit_reached").isBilling).toBe(true);
  });

  it("does not treat other failures as billing", () => {
    expect(new OpenAIImageError("Rate limit reached", 429, "rate_limit_exceeded").isBilling).toBe(false);
    expect(new OpenAIImageError("Your prompt was rejected by the safety system", 400, "content_policy_violation").isBilling).toBe(false);
  });
});
