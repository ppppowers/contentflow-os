import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const extractedItem = z.object({ title: z.string(), detail: z.string() }).strict();
const followUp = z.object({ question: z.string(), why: z.string() }).strict();

// Monthly Intelligence Brief — the Interview Agent's structured output.
export const intelligenceBriefSchema = z
  .object({
    summary: z.string(),
    readinessScore: z.number().int().min(0).max(100),
    extracted: z
      .object({
        stories: z.array(extractedItem),
        promotions: z.array(extractedItem),
        events: z.array(extractedItem),
        customerWins: z.array(extractedItem),
        teamAchievements: z.array(extractedItem),
      })
      .strict(),
    gaps: z.array(z.string()),
    followUpQuestions: z.array(followUp),
  })
  .strict();

export type IntelligenceBrief = z.infer<typeof intelligenceBriefSchema>;

// Structured-output JSON schema for the Claude call.
export const briefJsonSchema = (() => {
  const { $schema, ...rest } = zodToJsonSchema(intelligenceBriefSchema, { target: "jsonSchema7" }) as Record<
    string,
    unknown
  >;
  return rest;
})();

// Pure: total extracted opportunities across all five categories.
export function countExtracted(brief: IntelligenceBrief): number {
  const e = brief.extracted;
  return (
    e.stories.length +
    e.promotions.length +
    e.events.length +
    e.customerWins.length +
    e.teamAchievements.length
  );
}
