import { createClient } from "@/lib/supabase/server";
import type { PerformanceReport } from "@/lib/validation/performance";

export type MetricRow = {
  id: string;
  channel: string;
  subject_line: string | null;
  sent: number; opens: number; clicks: number; replies: number; conversions: number; unsubscribes: number;
  recorded_at: string;
};

export async function listMetrics(clientId: string): Promise<MetricRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("performance_metrics")
    .select("id, channel, subject_line, sent, opens, clicks, replies, conversions, unsubscribes, recorded_at")
    .eq("client_id", clientId)
    .order("recorded_at", { ascending: false });
  return (data as MetricRow[] | null) ?? [];
}

export async function getLatestReport(clientId: string): Promise<{ id: string; payload: PerformanceReport; created_at: string } | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("performance_reports")
    .select("id, payload, created_at")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as { id: string; payload: PerformanceReport; created_at: string } | null) ?? null;
}
