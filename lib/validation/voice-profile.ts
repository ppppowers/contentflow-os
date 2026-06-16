import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const voiceProfileSchema = z
  .object({
    summary: z.string(),
    vocabulary: z.array(z.string()),    // signature words/phrases
    tone: z.string(),
    personality: z.string(),
    formality: z.string(),               // e.g. "casual", "professional but warm"
    ctaStyle: z.string(),
    doList: z.array(z.string()),
    dontList: z.array(z.string()),
  })
  .strict();

export type VoiceProfile = z.infer<typeof voiceProfileSchema>;

export const voiceProfileJsonSchema = (() => {
  const { $schema, ...rest } = zodToJsonSchema(voiceProfileSchema, { target: "jsonSchema7" }) as Record<string, unknown>;
  return rest;
})();
