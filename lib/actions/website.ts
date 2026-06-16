"use server";

import { revalidatePath } from "next/cache";
import { createClient as supabaseServer } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/guards";
import { isStaff } from "@/lib/auth/roles";
import { getLatestAnalysis } from "@/lib/data/website";

// Promote extracted services + USPs from the latest website analysis into the
// client's Business Brain (services → service, USPs → key_fact).
export async function saveAnalysisToBrain(clientId: string): Promise<void> {
  const ctx = await getSessionContext();
  if (!ctx || !isStaff(ctx.role)) return;

  const analysis = await getLatestAnalysis(clientId);
  if (!analysis) return;
  const a = analysis.payload;

  const rows = [
    ...a.services.map((s) => ({ category: "service", title: s, body: "" })),
    ...a.uniqueSellingPoints.map((u) => ({ category: "key_fact", title: u, body: "" })),
  ];
  if (rows.length === 0) return;

  const supabase = supabaseServer();
  await supabase.from("brain_entries").insert(
    rows.map((r) => ({
      agency_id: ctx.agencyId,
      client_id: clientId,
      category: r.category,
      title: r.title.slice(0, 200),
      body: r.body,
      source: "website",
      created_by: ctx.userId,
    })),
  );

  revalidatePath(`/clients/${clientId}/brain`);
  revalidatePath(`/clients/${clientId}/website`);
}
