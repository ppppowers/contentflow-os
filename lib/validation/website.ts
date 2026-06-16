import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const idea = z.object({ title: z.string(), angle: z.string() }).strict();

// Website Intelligence Engine output.
export const websiteAnalysisSchema = z
  .object({
    brandVoice: z.string(),
    audience: z.string(),
    services: z.array(z.string()),
    keywords: z.array(z.string()),
    uniqueSellingPoints: z.array(z.string()),
    ideas: z
      .object({
        newsletters: z.array(idea),
        blogs: z.array(idea),
        campaigns: z.array(idea),
      })
      .strict(),
  })
  .strict();

export type WebsiteAnalysis = z.infer<typeof websiteAnalysisSchema>;

export const websiteJsonSchema = (() => {
  const { $schema, ...rest } = zodToJsonSchema(websiteAnalysisSchema, { target: "jsonSchema7" }) as Record<
    string,
    unknown
  >;
  return rest;
})();
