"use server";

import { revalidatePath } from "next/cache";
import { createClient as supabaseServer } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/guards";
import { isAdmin } from "@/lib/auth/roles";
import { brandingSchema } from "@/lib/validation/extensions";
import { isProvider } from "@/lib/extensions/registry";

export type ActionResult = { error: string } | { ok: true };

async function adminContext() {
  const ctx = await getSessionContext();
  if (!ctx || !isAdmin(ctx.role)) return null;
  return ctx;
}

export async function saveBranding(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const ctx = await adminContext();
  if (!ctx) return { error: "Admins only." };

  const parsed = brandingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = supabaseServer();
  const { error } = await supabase.from("agency_branding").upsert({
    agency_id: ctx.agencyId,
    brand_name: parsed.data.brand_name ?? null,
    logo_url: parsed.data.logo_url ?? null,
    primary_color: parsed.data.primary_color ?? null,
    custom_domain: parsed.data.custom_domain ?? null,
    white_label: parsed.data.white_label,
  });
  if (error) return { error: "Could not save branding." };

  revalidatePath("/integrations");
  return { ok: true };
}

export async function setIntegrationEnabled(providerId: string, enabled: boolean): Promise<void> {
  const ctx = await adminContext();
  if (!ctx || !isProvider(providerId)) return;
  const supabase = supabaseServer();
  await supabase.from("integration_connections").upsert(
    { agency_id: ctx.agencyId, provider_id: providerId, enabled, created_by: ctx.userId },
    { onConflict: "agency_id,provider_id" },
  );
  revalidatePath("/integrations");
}
