import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const PERF_CHANNELS = ["newsletter", "email", "facebook", "linkedin", "instagram", "sms", "blog"] as const;

export const metricFormSchema = z.object({
  channel: z.string().trim().min(1).default("newsletter"),
  subject_line: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
  sent: z.coerce.number().int().min(0).default(0),
  opens: z.coerce.number().int().min(0).default(0),
  clicks: z.coerce.number().int().min(0).default(0),
  replies: z.coerce.number().int().min(0).default(0),
  conversions: z.coerce.number().int().min(0).default(0),
  unsubscribes: z.coerce.number().int().min(0).default(0),
});
export type MetricFormInput = z.infer<typeof metricFormSchema>;

export const performanceReportSchema = z
  .object({
    summary: z.string(),
    subjectLineInsights: z.array(z.string()),
    ctaInsights: z.array(z.string()),
    topicInsights: z.array(z.string()),
    recommendations: z.array(z.string()),
  })
  .strict();
export type PerformanceReport = z.infer<typeof performanceReportSchema>;

export const performanceReportJsonSchema = (() => {
  const { $schema, ...rest } = zodToJsonSchema(performanceReportSchema, { target: "jsonSchema7" }) as Record<string, unknown>;
  return rest;
})();

export type MetricLike = {
  sent: number; opens: number; clicks: number; replies: number; conversions: number; unsubscribes: number;
};
export type Rates = { openRate: number; clickRate: number; replyRate: number; conversionRate: number; unsubRate: number };

// Pure: percentage rates from a metric. 0 when nothing was sent. Rounded to 1dp.
export function computeRates(m: MetricLike): Rates {
  const pct = (n: number) => (m.sent > 0 ? Math.round((n / m.sent) * 1000) / 10 : 0);
  return {
    openRate: pct(m.opens),
    clickRate: pct(m.clicks),
    replyRate: pct(m.replies),
    conversionRate: pct(m.conversions),
    unsubRate: pct(m.unsubscribes),
  };
}
