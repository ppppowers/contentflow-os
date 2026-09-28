import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

function jsonSchema(schema: z.ZodTypeAny): Record<string, unknown> {
  const { $schema: _omit, ...rest } = zodToJsonSchema(schema, { target: "jsonSchema7" }) as Record<string, unknown>;
  return rest;
}

export const outlineItemSchema = z.object({
  heading: z.string(),
  level: z.number().int().min(2).max(3),
  notes: z.string(),
});
export type OutlineItem = z.infer<typeof outlineItemSchema>;

// What currently ranks for a keyword, and what a better article must cover.
export const researchSchema = z.object({
  searchIntent: z.string(),
  summary: z.string(),
  competitors: z.array(
    z.object({ title: z.string(), url: z.string(), angle: z.string(), strengths: z.string(), weaknesses: z.string() }),
  ),
  questions: z.array(z.string()),
  contentGaps: z.array(z.string()),
  keyTerms: z.array(z.object({ term: z.string(), importance: z.enum(["must", "should", "nice"]) })),
  recommendedWords: z.number().int(),
  outline: z.array(outlineItemSchema),
});
export type Research = z.infer<typeof researchSchema>;
export const researchJsonSchema = jsonSchema(researchSchema);

export const faqItemSchema = z.object({ question: z.string(), answer: z.string() });
export type FaqItem = z.infer<typeof faqItemSchema>;

export const articleSchema = z.object({
  title: z.string(),
  metaDescription: z.string(),
  slug: z.string(),
  bodyMarkdown: z.string(),
  faq: z.array(faqItemSchema),
});
export type ArticleDraft = z.infer<typeof articleSchema>;
export const articleJsonSchema = jsonSchema(articleSchema);

// Extracted from an AI answer: is the brand named, where, and who else is.
export const mentionSchema = z.object({
  mentioned: z.boolean(),
  position: z.number().int().nullable(),
  excerpt: z.string(),
  competitors: z.array(z.string()),
});
export type Mention = z.infer<typeof mentionSchema>;
export const mentionJsonSchema = jsonSchema(mentionSchema);

// Web presence check: does the site appear in results for the keyword.
export const presenceSchema = z.object({
  found: z.boolean(),
  position: z.number().int().nullable(),
  matchedUrl: z.string().nullable(),
  topResults: z.array(z.object({ title: z.string(), url: z.string() })),
});
export type Presence = z.infer<typeof presenceSchema>;
export const presenceJsonSchema = jsonSchema(presenceSchema);
