"use server";

import { revalidatePath } from "next/cache";
import { createClient as supabaseServer } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/guards";
import { isStaff } from "@/lib/auth/roles";
import { intakeItemSchema, intakeFileSchema, isValidPeriod } from "@/lib/validation/intake";

export type ActionResult<T = unknown> = { error: string } | ({ ok: true } & T);

async function staffContext() {
  const ctx = await getSessionContext();
  if (!ctx || !isStaff(ctx.role)) return null;
  return ctx;
}

function revalidateIntake(clientId: string) {
  revalidatePath(`/clients/${clientId}/intake`);
}

// Get-or-create the submission for a client + period. Returns its id.
export async function ensureSubmission(clientId: string, period: string): Promise<ActionResult<{ submissionId: string }>> {
  const ctx = await staffContext();
  if (!ctx) return { error: "Not authorized." };
  if (!isValidPeriod(period)) return { error: "Invalid period." };

  const supabase = supabaseServer();
  const { data: existing } = await supabase
    .from("intake_submissions")
    .select("id")
    .eq("client_id", clientId)
    .eq("period", period)
    .maybeSingle();
  if (existing) return { ok: true, submissionId: existing.id };

  const { data, error } = await supabase
    .from("intake_submissions")
    .insert({ agency_id: ctx.agencyId, client_id: clientId, period, status: "open", submitted_by: ctx.userId })
    .select("id")
    .single();
  if (error || !data) return { error: "Could not start intake." };

  revalidateIntake(clientId);
  return { ok: true, submissionId: data.id };
}

// Thin void wrapper so a <form action> can start the month's intake.
export async function startIntake(clientId: string, period: string): Promise<void> {
  await ensureSubmission(clientId, period);
}

export async function addIntakeItem(
  clientId: string,
  submissionId: string,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await staffContext();
  if (!ctx) return { error: "Not authorized." };

  const parsed = intakeItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = supabaseServer();
  const { error } = await supabase
    .from("intake_items")
    .insert({ ...parsed.data, submission_id: submissionId, agency_id: ctx.agencyId });
  if (error) return { error: "Could not add item." };

  revalidateIntake(clientId);
  return { ok: true };
}

export async function deleteIntakeItem(clientId: string, itemId: string): Promise<void> {
  const ctx = await staffContext();
  if (!ctx) return;
  const supabase = supabaseServer();
  await supabase.from("intake_items").delete().eq("id", itemId).eq("agency_id", ctx.agencyId);
  revalidateIntake(clientId);
}

// Record a file already uploaded to Storage (browser upload via RLS).
export async function recordIntakeFile(
  clientId: string,
  submissionId: string,
  input: unknown,
): Promise<ActionResult> {
  const ctx = await staffContext();
  if (!ctx) return { error: "Not authorized." };

  const parsed = intakeFileSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid file metadata." };

  // Path must live under this agency's prefix (matches storage RLS).
  if (!parsed.data.storage_path.startsWith(`${ctx.agencyId}/`)) {
    return { error: "Invalid file path." };
  }

  const supabase = supabaseServer();
  const { error } = await supabase.from("intake_files").insert({
    agency_id: ctx.agencyId,
    submission_id: submissionId,
    intake_item_id: parsed.data.intake_item_id ?? null,
    storage_path: parsed.data.storage_path,
    file_name: parsed.data.file_name,
    mime_type: parsed.data.mime_type ?? null,
    size_bytes: parsed.data.size_bytes ?? null,
  });
  if (error) return { error: "Could not record file." };

  revalidateIntake(clientId);
  return { ok: true };
}

export async function deleteIntakeFile(clientId: string, fileId: string, storagePath: string): Promise<void> {
  const ctx = await staffContext();
  if (!ctx) return;
  if (!storagePath.startsWith(`${ctx.agencyId}/`)) return;

  const supabase = supabaseServer();
  await supabase.storage.from("intake").remove([storagePath]);
  await supabase.from("intake_files").delete().eq("id", fileId).eq("agency_id", ctx.agencyId);
  revalidateIntake(clientId);
}

export async function submitIntake(clientId: string, submissionId: string): Promise<void> {
  const ctx = await staffContext();
  if (!ctx) return;
  const supabase = supabaseServer();
  await supabase
    .from("intake_submissions")
    .update({ status: "submitted", submitted_by: ctx.userId })
    .eq("id", submissionId)
    .eq("agency_id", ctx.agencyId);
  revalidateIntake(clientId);
}

export async function markReviewed(clientId: string, submissionId: string): Promise<void> {
  const ctx = await staffContext();
  if (!ctx) return;
  const supabase = supabaseServer();
  await supabase
    .from("intake_submissions")
    .update({ status: "reviewed", reviewed_by: ctx.userId })
    .eq("id", submissionId)
    .eq("agency_id", ctx.agencyId);
  revalidateIntake(clientId);
}
