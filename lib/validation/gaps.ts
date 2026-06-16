import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const gapAnalysisSchema = z
  .object({
    summary: z.string(),
    missingTopics: z.array(z.string()),
    untappedServices: z.array(z.string()),
    overusedContent: z.array(z.string()),
    recommendations: z.array(z.string()),
  })
  .strict();

export type GapAnalysis = z.infer<typeof gapAnalysisSchema>;

export const gapJsonSchema = (() => {
  const { $schema, ...rest } = zodToJsonSchema(gapAnalysisSchema, { target: "jsonSchema7" }) as Record<string, unknown>;
  return rest;
})();
