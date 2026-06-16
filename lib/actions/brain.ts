"use server";

import { revalidatePath } from "next/cache";
import { createClient as supabaseServer } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/guards";
import { isStaff } from "@/lib/auth/roles";
import { brainEntrySchema } from "@/lib/validation/brain";

export type ActionResult = { error: string } | { ok: true };

async function staffContext() {
  const ctx = await getSessionContext();
  if (!ctx || !isStaff(ctx.role)) return null;
  return ctx;
}

export async function addBrainEntry(clientId: string, _prev: unknown, formData: FormData): Promise<ActionResult> {
  const ctx = await staffContext();
  if (!ctx) return { error: "Not authorized." };

  const parsed = brainEntrySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = supabaseServer();
  const { error } = await supabase.from("brain_entries").insert({
    agency_id: ctx.agencyId,
    client_id: clientId,
    category: parsed.data.category,
    title: parsed.data.title,
    body: parsed.data.body ?? "",
    priority: parsed.data.priority,
    created_by: ctx.userId,
  });
  if (error) return { error: "Could not save brain entry." };

  revalidatePath(`/clients/${clientId}/brain`);
  return { ok: true };
}

export async function setBrainEntryActive(clientId: string, entryId: string, isActive: boolean): Promise<void> {
  const ctx = await staffContext();
  if (!ctx) return;
  const supabase = supabaseServer();
  await supabase
    .from("brain_entries")
    .update({ is_active: isActive })
    .eq("id", entryId)
    .eq("agency_id", ctx.agencyId);
  revalidatePath(`/clients/${clientId}/brain`);
}

export async function deleteBrainEntry(clientId: string, entryId: string): Promise<void> {
  const ctx = await staffContext();
  if (!ctx) return;
  const supabase = supabaseServer();
  await supabase.from("brain_entries").delete().eq("id", entryId).eq("agency_id", ctx.agencyId);
  revalidatePath(`/clients/${clientId}/brain`);
}
