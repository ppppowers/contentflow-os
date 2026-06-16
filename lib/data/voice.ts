import { createClient } from "@/lib/supabase/server";
import type { MeetingReport } from "@/lib/validation/voice";

export type MeetingRow = {
  id: string;
  title: string;
  source_type: string;
  payload: MeetingReport;
  created_at: string;
};

export async function listMeetingReports(clientId: string): Promise<MeetingRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("meeting_intelligence")
    .select("id, title, source_type, payload, created_at")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  return (data as MeetingRow[] | null) ?? [];
}

export async function getMeetingReport(reportId: string): Promise<MeetingRow | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("meeting_intelligence")
    .select("id, title, source_type, payload, created_at")
    .eq("id", reportId)
    .maybeSingle();
  return (data as MeetingRow | null) ?? null;
}
