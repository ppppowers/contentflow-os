import { describe, it, expect, vi, beforeEach } from "vitest";

const calls: { messages: { role: string; content: unknown }[]; tools: unknown[] }[] = [];
let responses: unknown[] = [];
vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = {
      create: async (req: { messages: { role: string; content: unknown }[]; tools: unknown[] }) => {
        calls.push({ messages: [...req.messages], tools: req.tools });
        return responses.shift();
      },
    };
  },
}));

import { callWithWebSearch } from "@/lib/claude/client";

describe("callWithWebSearch", () => {
  beforeEach(() => {
    calls.length = 0;
    process.env.ANTHROPIC_API_KEY = "test";
  });

  it("resumes after pause_turn and collects sources from both turns", async () => {
    const paused = {
      stop_reason: "pause_turn",
      usage: { input_tokens: 10, output_tokens: 5 },
      content: [
        { type: "server_tool_use", id: "s1", name: "web_search", input: { query: "kw" } },
        { type: "web_search_tool_result", tool_use_id: "s1", content: [{ type: "web_search_result", url: "https://a.com", title: "A" }] },
      ],
    };
    responses = [
      paused,
      {
        stop_reason: "end_turn",
        usage: { input_tokens: 20, output_tokens: 30 },
        content: [
          { type: "web_search_tool_result", tool_use_id: "s2", content: [{ type: "web_search_result", url: "https://b.com", title: "B" }] },
          { type: "text", text: "Final answer." },
        ],
      },
    ];
    const r = await callWithWebSearch({ tier: "mid", system: "s", user: "u", maxUses: 3 });
    expect(r.text).toBe("Final answer.");
    expect(r.sources.map((s) => s.url)).toEqual(["https://a.com", "https://b.com"]);
    expect(r.usage.inputTokens).toBe(30);
    // Second request re-sends the paused assistant turn, without an extra user message.
    expect(calls[1].messages).toHaveLength(2);
    expect(calls[1].messages[1]).toEqual({ role: "assistant", content: paused.content });
    expect(calls[0].tools).toEqual([{ type: "web_search_20260209", name: "web_search", max_uses: 3 }]);
  });

  it("ignores search errors (object content) and throws on refusal", async () => {
    responses = [
      {
        stop_reason: "end_turn",
        content: [
          { type: "web_search_tool_result", content: { type: "web_search_tool_result_error", error_code: "max_uses_exceeded" } },
          { type: "text", text: "ok" },
        ],
      },
    ];
    expect((await callWithWebSearch({ tier: "mid", system: "s", user: "u" })).sources).toEqual([]);
    responses = [{ stop_reason: "refusal", content: [] }];
    await expect(callWithWebSearch({ tier: "mid", system: "s", user: "u" })).rejects.toThrow(/declined/);
  });
});
