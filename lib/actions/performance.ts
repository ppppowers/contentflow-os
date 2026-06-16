"use server";

import { revalidatePath } from "next/cache";
import { createClient as supabaseServer } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/guards";
import { isStaff } from "@/lib/auth/roles";
import { metricFormSchema } from "@/lib/validation/performance";

export type ActionResult = { error: string } | { ok: true };

async function staffContext() {
  const ctx = await getSessionContext();
  if (!ctx || !isStaff(ctx.role)) return null;
  return ctx;
}

export async function recordMetric(clientId: string, _prev: unknown, formData: FormData): Promise<ActionResult> {
  const ctx = await staffContext();
  if (!ctx) return { error: "Not authorized." };

  const parsed = metricFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = supabaseServer();
  const { error } = await supabase.from("performance_metrics").insert({
    agency_id: ctx.agencyId,
    client_id: clientId,
    channel: parsed.data.channel,
    subject_line: parsed.data.subject_line ?? null,
    sent: parsed.data.sent,
    opens: parsed.data.opens,
    clicks: parsed.data.clicks,
    replies: parsed.data.replies,
    conversions: parsed.data.conversions,
    unsubscribes: parsed.data.unsubscribes,
    created_by: ctx.userId,
  });
  if (error) return { error: "Could not record metric." };

  revalidatePath(`/clients/${clientId}/performance`);
  return { ok: true };
}

export async function deleteMetric(clientId: string, metricId: string): Promise<void> {
  const ctx = await staffContext();
  if (!ctx) return;
  const supabase = supabaseServer();
  await supabase.from("performance_metrics").delete().eq("id", metricId).eq("agency_id", ctx.agencyId);
  revalidatePath(`/clients/${clientId}/performance`);
}
