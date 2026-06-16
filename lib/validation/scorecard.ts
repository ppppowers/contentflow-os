import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const SCORECARD_TARGET = 95;

export const SCORECARD_DIMENSIONS = [
  "businessValue", "humanAuthenticity", "specificity", "brandVoice",
  "readability", "engagement", "evidence", "ctaQuality",
] as const;
export type ScorecardDimension = (typeof SCORECARD_DIMENSIONS)[number];

export const SCORECARD_LABELS: Record<ScorecardDimension, string> = {
  businessValue: "Business Value",
  humanAuthenticity: "Human Authenticity",
  specificity: "Specificity",
  brandVoice: "Brand Voice",
  readability: "Readability",
  engagement: "Engagement",
  evidence: "Evidence",
  ctaQuality: "CTA Quality",
};

// The five LLM-judged dimensions (deterministic ones come from real metrics).
export const scorecardJudgeSchema = z
  .object({
    businessValue: z.number().int().min(0).max(100),
    brandVoice: z.number().int().min(0).max(100),
    engagement: z.number().int().min(0).max(100),
    evidence: z.number().int().min(0).max(100),
    ctaQuality: z.number().int().min(0).max(100),
    summary: z.string(),
  })
  .strict();
export type ScorecardJudge = z.infer<typeof scorecardJudgeSchema>;

export const scorecardJudgeJsonSchema = (() => {
  const { $schema, ...rest } = zodToJsonSchema(scorecardJudgeSchema, { target: "jsonSchema7" }) as Record<string, unknown>;
  return rest;
})();

// Pure: Flesch Reading Ease → 0-100 readability score (approx syllables by vowel groups).
export function readabilityScore(text: string): number {
  const words = (text.match(/[A-Za-z]+/g) ?? []);
  const sentences = (text.match(/[.!?]+/g) ?? []).length || 1;
  if (words.length === 0) return 0;
  const syllables = words.reduce((s, w) => s + countSyllables(w), 0);
  const fre = 206.835 - 1.015 * (words.length / sentences) - 84.6 * (syllables / words.length);
  return Math.max(0, Math.min(100, Math.round(fre)));
}

function countSyllables(word: string): number {
  const w = word.toLowerCase();
  const groups = w.match(/[aeiouy]+/g);
  let n = groups ? groups.length : 1;
  if (w.length > 2 && w.endsWith("e")) n -= 1; // silent e
  return Math.max(1, n);
}

// Pure: overall = average of all 8 dimension scores; passes at the target.
export function composeOverall(scores: Record<ScorecardDimension, number>): { overall: number; passed: boolean } {
  const vals = SCORECARD_DIMENSIONS.map((d) => scores[d] ?? 0);
  const overall = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  return { overall, passed: overall >= SCORECARD_TARGET };
}
