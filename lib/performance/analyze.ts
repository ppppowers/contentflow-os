import { createClient } from "@/lib/supabase/server";
import { callStructured } from "@/lib/claude/client";
import {
  performanceReportSchema,
  performanceReportJsonSchema,
  computeRates,
} from "@/lib/validation/performance";

export type AnalyzeResult = { ok: true; reportId: string } | { ok: false; error: string };

const SYSTEM = `You are the Performance Learning engine for ContentFlow OS.
Given per-send metrics (with computed rates), analyze what's working:
- subjectLineInsights: which subject-line styles drove opens.
- ctaInsights: what drove clicks/replies/conversions.
- topicInsights: what topics/channels performed.
- recommendations: concrete next steps to lift performance.
Ground every claim in the numbers given. Respond ONLY with JSON matching the schema.`;

export async function analyzePerformance(
  clientId: string,
  ctx: { agencyId: string; userId: string },
): Promise<AnalyzeResult> {
  const supabase = createClient();
  const { data: metrics } = await supabase
    .from("performance_metrics")
    .select("channel, subject_line, sent, opens, clicks, replies, conversions, unsubscribes, recorded_at")
    .eq("client_id", clientId)
    .order("recorded_at", { ascending: false })
    .limit(100);
  const rows = (metrics as {
    channel: string; subject_line: string | null; sent: number; opens: number; clicks: number;
    replies: number; conversions: number; unsubscribes: number; recorded_at: string;
  }[] | null) ?? [];
  if (rows.length === 0) return { ok: false, error: "No metrics recorded yet." };

  const table = rows
    .map((m) => {
      const r = computeRates(m);
      return `${m.recorded_at} | ${m.channel} | "${m.subject_line ?? ""}" | sent ${m.sent} | open ${r.openRate}% | click ${r.clickRate}% | reply ${r.replyRate}% | conv ${r.conversionRate}% | unsub ${r.unsubRate}%`;
    })
    .join("\n");

  let parsed;
  try {
    const { data } = await callStructured({
      tier: "strong",
      system: SYSTEM,
      user: `METRICS (newest first):\n${table}`,
      schema: performanceReportJsonSchema,
    });
    parsed = performanceReportSchema.safeParse(data);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Analysis failed." };
  }
  if (!parsed.success) return { ok: false, error: "Report failed validation." };

  const { data: row, error } = await supabase
    .from("performance_reports")
    .insert({ agency_id: ctx.agencyId, client_id: clientId, payload: parsed.data, created_by: ctx.userId })
    .select("id")
    .single();
  if (error || !row) return { ok: false, error: "Could not save report." };
  return { ok: true, reportId: row.id as string };
}
