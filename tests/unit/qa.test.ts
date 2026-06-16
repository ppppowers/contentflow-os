import { describe, it, expect } from "vitest";
import { redTeamSchema, qaJudgeSchema, rollupQA, QA_LAYERS, type RedTeam } from "@/lib/validation/qa";

describe("redTeamSchema", () => {
  const valid: RedTeam = {
    isGeneric: false, isRepetitive: false, isUseful: true, subscribersWouldCare: true, soundsLikeAI: false,
    score: 82, verdict: "pass", findings: ["Tighten the opening line."], summary: "Strong, specific, human.",
  };
  it("accepts a valid review", () => expect(redTeamSchema.safeParse(valid).success).toBe(true));
  it("rejects an invalid verdict", () => expect(redTeamSchema.safeParse({ ...valid, verdict: "maybe" }).success).toBe(false));
  it("rejects unknown keys (strict)", () => expect(redTeamSchema.safeParse({ ...valid, x: 1 }).success).toBe(false));
});

describe("qaJudgeSchema", () => {
  it("requires the three judged layers", () => {
    const ok = {
      strategy: { score: 90, passed: true, findings: [] },
      writing: { score: 85, passed: true, findings: [] },
      brandVoice: { score: 88, passed: true, findings: [] },
      summary: "Solid.",
    };
    expect(qaJudgeSchema.safeParse(ok).success).toBe(true);
    const { writing, ...missing } = ok;
    expect(qaJudgeSchema.safeParse(missing).success).toBe(false);
  });
});

describe("rollupQA", () => {
  it("averages scores and passes only if all layers pass", () => {
    const r = rollupQA([{ score: 90, passed: true }, { score: 70, passed: true }]);
    expect(r.score).toBe(80);
    expect(r.passed).toBe(true);
  });
  it("fails overall if any layer fails", () => {
    const r = rollupQA([{ score: 95, passed: true }, { score: 40, passed: false }]);
    expect(r.passed).toBe(false);
  });
  it("handles empty", () => expect(rollupQA([])).toEqual({ score: 0, passed: false }));
});

describe("QA_LAYERS", () => {
  it("names all seven QA layers", () => {
    expect(QA_LAYERS).toEqual(["strategy", "writing", "humanization", "brand_voice", "compliance", "red_team", "final"]);
  });
});
