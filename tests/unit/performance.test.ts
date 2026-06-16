import { describe, it, expect } from "vitest";
import { computeRates, performanceReportSchema, type PerformanceReport } from "@/lib/validation/performance";

describe("computeRates", () => {
  it("computes percentage rates rounded to 1dp", () => {
    const r = computeRates({ sent: 1000, opens: 421, clicks: 87, replies: 12, conversions: 5, unsubscribes: 3 });
    expect(r.openRate).toBe(42.1);
    expect(r.clickRate).toBe(8.7);
    expect(r.replyRate).toBe(1.2);
    expect(r.conversionRate).toBe(0.5);
    expect(r.unsubRate).toBe(0.3);
  });
  it("is all zero when nothing was sent", () => {
    const r = computeRates({ sent: 0, opens: 0, clicks: 0, replies: 0, conversions: 0, unsubscribes: 0 });
    expect(r).toEqual({ openRate: 0, clickRate: 0, replyRate: 0, conversionRate: 0, unsubRate: 0 });
  });
});

describe("performanceReportSchema", () => {
  const valid: PerformanceReport = {
    summary: "Opens strong, clicks weak.",
    subjectLineInsights: ["Question subject lines opened best."],
    ctaInsights: ["Single CTA outperformed multiple."],
    topicInsights: ["Local stories beat promos."],
    recommendations: ["Lead with a question, one CTA."],
  };
  it("accepts a valid report", () => expect(performanceReportSchema.safeParse(valid).success).toBe(true));
  it("rejects unknown keys (strict)", () => expect(performanceReportSchema.safeParse({ ...valid, x: 1 }).success).toBe(false));
});
