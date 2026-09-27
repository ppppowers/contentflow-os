import { describe, it, expect, vi, beforeEach } from "vitest";

// Minimal Supabase stand-in: two finished pieces; records prompt saves.
const saved: Record<string, string> = {};
function query(table: string) {
  const q: Record<string, unknown> = {};
  let pendingUpdate: Record<string, unknown> | null = null;
  const chain = () => q;
  Object.assign(q, {
    select: chain,
    eq: (col: string, val: string) => {
      if (pendingUpdate && col === "id") saved[val] = pendingUpdate.image_prompt as string;
      return q;
    },
    update: (v: Record<string, unknown>) => ((pendingUpdate = v), q),
    insert: async () => ({ error: null }),
    single: async () => ({ data: { client_id: null, brief: "b", clients: { name: "Acme" } } }),
    maybeSingle: async () => ({ data: null }),
    then: (resolve: (v: unknown) => void) =>
      resolve(
        table === "content_pieces" && !pendingUpdate
          ? {
              data: [
                { id: "p1", channel: "instagram", body: "Post one" },
                { id: "p2", channel: "linkedin", body: "Post two" },
              ],
            }
          : { data: null, error: null },
      ),
  });
  return q;
}
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    from: query,
    storage: { from: () => ({ upload: async () => ({ error: null }) }) },
  }),
}));
vi.mock("@/lib/claude/client", () => ({
  callStructured: async () => ({
    data: {
      prompts: [
        { channel: "instagram", prompt: "A sunny cafe." },
        { channel: "linkedin", prompt: "A tidy desk." },
      ],
    },
  }),
}));

let failWith: Error | null = null;
vi.mock("@/lib/images/openai", async (orig) => {
  const real = await orig<typeof import("@/lib/images/openai")>();
  return {
    ...real,
    imagesConfigured: () => true,
    generateImage: async () => {
      if (failWith) throw failWith;
      return { png: Buffer.from(""), model: "m", size: "1024x1024" };
    },
  };
});

import { generateProjectImages } from "@/lib/images/service";
import { OpenAIImageError } from "@/lib/images/openai";

const ctx = { agencyId: "a", userId: "u" };

describe("generateProjectImages fallback", () => {
  beforeEach(() => {
    for (const k of Object.keys(saved)) delete saved[k];
  });

  it("returns and saves prompts when OpenAI is out of credits", async () => {
    failWith = new OpenAIImageError("You exceeded your current quota", 429, "insufficient_quota");
    const r = await generateProjectImages("proj", ctx);
    expect(r.created).toBe(0);
    expect(r.promptsOnly).toBe("no_credits");
    expect(r.prompts.map((p) => p.prompt)).toEqual(["A sunny cafe.", "A tidy desk."]);
    expect(saved).toEqual({ p1: "A sunny cafe.", p2: "A tidy desk." });
  });

  it("still returns prompts when OpenAI fails for a non-billing reason", async () => {
    failWith = new OpenAIImageError("Your organization must be verified to use gpt-image-2", 403, null);
    const r = await generateProjectImages("proj", ctx);
    expect(r.promptsOnly).toBe("failed");
    expect(r.errors[0]).toContain("verified");
    expect(r.prompts).toHaveLength(2);
  });

  it("makes images normally when OpenAI works", async () => {
    failWith = null;
    const r = await generateProjectImages("proj", ctx);
    expect(r.created).toBe(2);
    expect(r.promptsOnly).toBeUndefined();
  });
});
