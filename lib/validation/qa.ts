import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

// Red Team — answers the five questions + a verdict.
export const redTeamSchema = z
  .object({
    isGeneric: z.boolean(),
    isRepetitive: z.boolean(),
    isUseful: z.boolean(),
    subscribersWouldCare: z.boolean(),
    soundsLikeAI: z.boolean(),
    score: z.number().int().min(0).max(100),
    verdict: z.enum(["pass", "fail"]),
    findings: z.array(z.string()),
    summary: z.string(),
  })
  .strict();
export type RedTeam = z.infer<typeof redTeamSchema>;

export const redTeamJsonSchema = (() => {
  const { $schema, ...rest } = zodToJsonSchema(redTeamSchema, { target: "jsonSchema7" }) as Record<string, unknown>;
  return rest;
})();

// QA judge — LLM-scored layers (deterministic layers come from real data).
const layer = z.object({ score: z.number().int().min(0).max(100), passed: z.boolean(), findings: z.array(z.string()) }).strict();
export const qaJudgeSchema = z
  .object({ strategy: layer, writing: layer, brandVoice: layer, summary: z.string() })
  .strict();
export type QaJudge = z.infer<typeof qaJudgeSchema>;

export const qaJudgeJsonSchema = (() => {
  const { $schema, ...rest } = zodToJsonSchema(qaJudgeSchema, { target: "jsonSchema7" }) as Record<string, unknown>;
  return rest;
})();

export const QA_PASS_THRESHOLD = 80;
export const QA_LAYERS = ["strategy", "writing", "humanization", "brand_voice", "compliance", "red_team", "final"] as const;

// Pure: overall score = average of layer scores; passes only if every layer passed.
export function rollupQA(layers: { score: number; passed: boolean }[]): { score: number; passed: boolean } {
  if (layers.length === 0) return { score: 0, passed: false };
  const score = Math.round(layers.reduce((s, l) => s + l.score, 0) / layers.length);
  return { score, passed: layers.every((l) => l.passed) };
}
