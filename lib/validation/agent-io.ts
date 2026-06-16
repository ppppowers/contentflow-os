import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

// One output schema per agent. The persisted `agent_outputs.payload` matches these.
// `.strict()` → zod-to-json-schema emits additionalProperties:false (required by
// the structured-output API). Phases 8/9 expand the field sets.

export const accountManagerOut = z
  .object({
    summary: z.string(),
    missingInfo: z.array(z.string()),
    clarifications: z.array(z.string()),
  })
  .strict();

export const researchOut = z
  .object({
    brandVoice: z.string(),
    products: z.array(z.string()),
    audience: z.string(),
    positioning: z.string(),
  })
  .strict();

export const strategistOut = z
  .object({
    newsletterAngle: z.string(),
    blogAngle: z.string(),
    socialStrategy: z.string(),
    cta: z.string(),
    keyMessages: z.array(z.string()),
  })
  .strict();

export const newsletterOut = z
  .object({
    body: z.string(),
    subjectLines: z.array(z.string()),
    previewText: z.string(),
  })
  .strict();

export const seoBlogOut = z
  .object({
    article: z.string(),
    seoTitle: z.string(),
    metaDescription: z.string(),
    slug: z.string(),
    keywords: z.array(z.string()),
  })
  .strict();

export const socialOut = z
  .object({
    facebook: z.string(),
    linkedin: z.string(),
    instagram: z.string(),
    sms: z.string(),
  })
  .strict();

export const humanEditorOut = z
  .object({
    humanizedNewsletter: z.string(),
    humanizedBlog: z.string(),
    humanizedSocial: z
      .object({
        facebook: z.string(),
        linkedin: z.string(),
        instagram: z.string(),
        sms: z.string(),
      })
      .strict(),
    authenticityScore: z.number().int(),
    flaggedPhrases: z.array(z.string()),
    notes: z.string(),
  })
  .strict();

export const complianceOut = z
  .object({
    readability: z.number().int(),
    ctaQuality: z.number().int(),
    grammar: z.number().int(),
    mobileReadability: z.number().int(),
    spamRisk: z.number().int(),
    voiceConsistency: z.number().int(),
    passed: z.boolean(),
    issues: z.array(z.string()),
  })
  .strict();

export const deliveryOut = z
  .object({
    summary: z.string(),
    includes: z.array(z.string()),
    approvalPacket: z.string(),
  })
  .strict();

export const AGENT_SCHEMAS = {
  account_manager: accountManagerOut,
  research: researchOut,
  strategist: strategistOut,
  newsletter: newsletterOut,
  seo_blog: seoBlogOut,
  social: socialOut,
  human_editor: humanEditorOut,
  compliance: complianceOut,
  delivery: deliveryOut,
} as const;

export type AgentName = keyof typeof AGENT_SCHEMAS;

// JSON Schema for the API (strip the $schema header the API doesn't expect).
export function jsonSchemaFor(agent: AgentName): Record<string, unknown> {
  const { $schema, ...rest } = zodToJsonSchema(AGENT_SCHEMAS[agent], { target: "jsonSchema7" }) as Record<
    string,
    unknown
  >;
  return rest;
}
