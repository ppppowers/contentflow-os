import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const INDUSTRIES = [
  "Nonprofits", "Churches", "HVAC", "Plumbing", "Electrical", "Auto Repair",
  "Contractors", "Landscaping", "Law Firms", "Medical Offices", "SaaS",
] as const;
export type Industry = (typeof INDUSTRIES)[number];

const seasonal = z.object({ when: z.string(), idea: z.string() }).strict();

export const playbookSchema = z
  .object({
    campaignIdeas: z.array(z.string()),
    topicLibrary: z.array(z.string()),
    seasonalContent: z.array(seasonal),
    subjectLines: z.array(z.string()),
    ctas: z.array(z.string()),
  })
  .strict();

export type Playbook = z.infer<typeof playbookSchema>;

export const playbookJsonSchema = (() => {
  const { $schema, ...rest } = zodToJsonSchema(playbookSchema, { target: "jsonSchema7" }) as Record<string, unknown>;
  return rest;
})();
