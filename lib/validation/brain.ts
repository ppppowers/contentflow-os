import { z } from "zod";

export const BRAIN_CATEGORIES = [
  "company_history",
  "service",
  "product",
  "promotion",
  "event",
  "cta_preference",
  "audience_insight",
  "key_fact",
] as const;

export type BrainCategory = (typeof BRAIN_CATEGORIES)[number];

// Human-readable labels for the dashboard + context headers.
export const BRAIN_CATEGORY_LABELS: Record<BrainCategory, string> = {
  company_history: "Company History",
  service: "Services",
  product: "Products",
  promotion: "Promotions",
  event: "Events",
  cta_preference: "CTA Preferences",
  audience_insight: "Audience Insights",
  key_fact: "Key Facts",
};

export const brainEntrySchema = z.object({
  category: z.enum(BRAIN_CATEGORIES),
  title: z.string().trim().min(2, "Title required"),
  body: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
  priority: z.coerce.number().int().min(0).max(100).default(0),
});
export type BrainEntryInput = z.infer<typeof brainEntrySchema>;
