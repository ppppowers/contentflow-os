import { z } from "zod";

export const AGENCY_BRAIN_CATEGORIES = [
  "subject_line",
  "newsletter",
  "campaign",
  "prompt",
  "cta",
] as const;

export type AgencyBrainCategory = (typeof AGENCY_BRAIN_CATEGORIES)[number];

export const AGENCY_BRAIN_CATEGORY_LABELS: Record<AgencyBrainCategory, string> = {
  subject_line: "Best Subject Lines",
  newsletter: "Best Newsletters",
  campaign: "Best Campaign Angles",
  prompt: "Best Prompts",
  cta: "Best CTAs",
};

// Manual curation form (staff add a proven pattern by hand).
export const agencyBrainEntrySchema = z.object({
  category: z.enum(AGENCY_BRAIN_CATEGORIES),
  content: z.string().trim().min(2, "Content required"),
  authenticity_score: z.coerce.number().int().min(0).max(100).optional(),
});
export type AgencyBrainEntryInput = z.infer<typeof agencyBrainEntrySchema>;
