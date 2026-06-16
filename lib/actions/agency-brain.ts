"use server";

import { revalidatePath } from "next/cache";
import { createClient as supabaseServer } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/guards";
import { isStaff } from "@/lib/auth/roles";
import { agencyBrainEntrySchema } from "@/lib/validation/agency-brain";
import { harvestProject } from "@/lib/agency-brain/learn";

export type ActionResult = { error: string } | { ok: true };

async function staffContext() {
  const ctx = await getSessionContext();
  if (!ctx || !isStaff(ctx.role)) return null;
  return ctx;
}

// Manual curation: staff add a proven pattern by hand.
export async function addAgencyBrainEntry(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const ctx = await staffContext();
  if (!ctx) return { error: "Not authorized." };

  const parsed = agencyBrainEntrySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = supabaseServer();
  const { error } = await supabase.from("agency_brain_entries").insert({
    agency_id: ctx.agencyId,
    category: parsed.data.category,
    content: parsed.data.content,
    authenticity_score: parsed.data.authenticity_score ?? null,
    created_by: ctx.userId,
  });
  if (error) return { error: "Could not save entry." };

  revalidatePath("/agency-brain");
  return { ok: true };
}

// Staff manual promote of a project's winning elements into the Agency Brain.
export async function promoteProject(projectId: string): Promise<void> {
  const ctx = await staffContext();
  if (!ctx) return;
  const supabase = supabaseServer();
  await harvestProject(projectId, supabase, { agencyId: ctx.agencyId, userId: ctx.userId });
  revalidatePath("/agency-brain");
  revalidatePath(`/content/${projectId}`);
}

export async function setAgencyEntryActive(entryId: string, isActive: boolean): Promise<void> {
  const ctx = await staffContext();
  if (!ctx) return;
  const supabase = supabaseServer();
  await supabase
    .from("agency_brain_entries")
    .update({ is_active: isActive })
    .eq("id", entryId)
    .eq("agency_id", ctx.agencyId);
  revalidatePath("/agency-brain");
}

export async function deleteAgencyEntry(entryId: string): Promise<void> {
  const ctx = await staffContext();
  if (!ctx) return;
  const supabase = supabaseServer();
  await supabase.from("agency_brain_entries").delete().eq("id", entryId).eq("agency_id", ctx.agencyId);
  revalidatePath("/agency-brain");
}
