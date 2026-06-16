"use server";

import { revalidatePath } from "next/cache";
import { createClient as supabaseServer } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/guards";
import { isStaff } from "@/lib/auth/roles";
import { currentPeriod } from "@/lib/validation/intake";
import { ensureSubmission } from "@/lib/actions/intake";
import { getMeetingReport } from "@/lib/data/voice";

// Map a report category to the closest intake type.
const TYPE_MAP: Record<string, string> = {
  stories: "customer_story",
  promotions: "promotion",
  customerWins: "customer_story",
  contentOpportunities: "business_update",
};

// Push a report's extracted opportunities into THIS month's intake as items,
// so meeting findings flow straight into the content pipeline.
export async function captureReportToIntake(clientId: string, reportId: string): Promise<void> {
  const ctx = await getSessionContext();
  if (!ctx || !isStaff(ctx.role)) return;

  const report = await getMeetingReport(reportId);
  if (!report) return;
  const e = report.payload.extracted;

  const rows: { type: string; title: string; body: string }[] = [];
  for (const cat of ["stories", "promotions", "customerWins", "contentOpportunities"] as const) {
    for (const it of e[cat]) {
      rows.push({ type: TYPE_MAP[cat], title: it.title, body: it.detail });
    }
  }
  if (rows.length === 0) return;

  const ensured = await ensureSubmission(clientId, currentPeriod());
  if ("error" in ensured) return;

  const supabase = supabaseServer();
  await supabase.from("intake_items").insert(
    rows.map((r) => ({
      agency_id: ctx.agencyId,
      submission_id: ensured.submissionId,
      type: r.type,
      title: r.title.slice(0, 200),
      body: r.body,
    })),
  );

  revalidatePath(`/clients/${clientId}/meetings`);
  revalidatePath(`/clients/${clientId}/intake`);
}
