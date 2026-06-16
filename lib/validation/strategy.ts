import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const HORIZONS = [30, 60, 90] as const;
export type Horizon = (typeof HORIZONS)[number];

export const RECOMMENDATION_TYPES = ["newsletter", "blog", "campaign", "promotion"] as const;
export type RecommendationType = (typeof RECOMMENDATION_TYPES)[number];

export const RECOMMENDATION_TYPE_LABELS: Record<RecommendationType, string> = {
  newsletter: "Newsletter",
  blog: "Blog",
  campaign: "Campaign",
  promotion: "Promotion",
};

const recommendation = z
  .object({
    type: z.enum(RECOMMENDATION_TYPES),
    title: z.string(),
    angle: z.string(),
    suggestedWeek: z.number().int().min(1).max(13),
    rationale: z.string(),
  })
  .strict();

export const contentRoadmapSchema = z
  .object({
    summary: z.string(),
    recommendations: z.array(recommendation),
  })
  .strict();

export type ContentRoadmap = z.infer<typeof contentRoadmapSchema>;
export type Recommendation = z.infer<typeof recommendation>;

export const roadmapJsonSchema = (() => {
  const { $schema, ...rest } = zodToJsonSchema(contentRoadmapSchema, { target: "jsonSchema7" }) as Record<
    string,
    unknown
  >;
  return rest;
})();

export function isHorizon(n: number): n is Horizon {
  return (HORIZONS as readonly number[]).includes(n);
}

// Pure: group recommendations by week (1..weeks), preserving order within a week.
export function groupByWeek(recs: Recommendation[], weeks: number): { week: number; items: Recommendation[] }[] {
  const out: { week: number; items: Recommendation[] }[] = [];
  for (let w = 1; w <= weeks; w++) {
    const items = recs.filter((r) => r.suggestedWeek === w);
    if (items.length > 0) out.push({ week: w, items });
  }
  return out;
}
