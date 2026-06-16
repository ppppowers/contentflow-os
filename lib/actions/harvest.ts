"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient as supabaseServer } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/guards";
import { isStaff } from "@/lib/auth/roles";
import { INTAKE_TYPES, currentPeriod } from "@/lib/validation/intake";
import { ensureSubmission } from "@/lib/actions/intake";

export type ActionResult = { error: string } | { ok: true };

const captureSchema = z.object({
  type: z.enum(INTAKE_TYPES),
  title: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
  body: z.string().trim().min(1, "Add some detail"),
});

async function staffContext() {
  const ctx = await getSessionContext();
  if (!ctx || !isStaff(ctx.role)) return null;
  return ctx;
}

// Frictionless capture: drop a typed item into THIS month's intake submission,
// creating the submission on the fly. The harvesting layer never asks the user
// to think about periods or submissions.
export async function captureContent(clientId: string, _prev: unknown, formData: FormData): Promise<ActionResult> {
  const ctx = await staffContext();
  if (!ctx) return { error: "Not authorized." };

  const parsed = captureSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const ensured = await ensureSubmission(clientId, currentPeriod());
  if ("error" in ensured) return { error: ensured.error };

  const supabase = supabaseServer();
  const { error } = await supabase.from("intake_items").insert({
    agency_id: ctx.agencyId,
    submission_id: ensured.submissionId,
    type: parsed.data.type,
    title: parsed.data.title ?? null,
    body: parsed.data.body,
  });
  if (error) return { error: "Could not save capture." };

  revalidatePath("/collect");
  return { ok: true };
}

// Ensure (and return) this month's submission id — used by the media uploader,
// whose storage path needs a submission id before the browser upload.
export async function ensureCurrentSubmission(clientId: string): Promise<{ submissionId: string } | { error: string }> {
  const ctx = await staffContext();
  if (!ctx) return { error: "Not authorized." };
  const ensured = await ensureSubmission(clientId, currentPeriod());
  if ("error" in ensured) return { error: ensured.error };
  return { submissionId: ensured.submissionId };
}
