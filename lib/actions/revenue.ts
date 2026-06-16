"use server";

import { revalidatePath } from "next/cache";
import { createClient as supabaseServer } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/guards";
import { isAdmin } from "@/lib/auth/roles";
import { packageSchema, subscriptionSchema, revenueEventSchema } from "@/lib/validation/revenue";

export type ActionResult = { error: string } | { ok: true };

async function adminCtx() {
  const ctx = await getSessionContext();
  if (!ctx || !isAdmin(ctx.role)) return null;
  return ctx;
}

function monthBounds() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export async function createPackage(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const ctx = await adminCtx();
  if (!ctx) return { error: "Not authorized." };
  const parsed = packageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = supabaseServer();
  const { error } = await supabase.from("packages").insert({
    agency_id: ctx.agencyId,
    name: parsed.data.name,
    monthly_price: parsed.data.monthly_price,
    deliverables: parsed.data.deliverables ?? [],
  });
  if (error) return { error: "Could not create package." };
  revalidatePath("/revenue");
  return { ok: true };
}

export async function createSubscription(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const ctx = await adminCtx();
  if (!ctx) return { error: "Not authorized." };
  const parsed = subscriptionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const { start, end } = monthBounds();

  const supabase = supabaseServer();
  const { error } = await supabase.from("subscriptions").insert({
    agency_id: ctx.agencyId,
    client_id: parsed.data.client_id,
    package_id: parsed.data.package_id ?? null,
    monthly_amount: parsed.data.monthly_amount,
    status: parsed.data.status,
    current_period_start: start,
    current_period_end: end,
  });
  if (error) return { error: "Could not create subscription." };
  revalidatePath("/revenue");
  return { ok: true };
}

export async function updateSubscriptionStatus(subId: string, status: string): Promise<void> {
  const ctx = await adminCtx();
  if (!ctx) return;
  const supabase = supabaseServer();
  await supabase
    .from("subscriptions")
    .update({ status })
    .eq("id", subId)
    .eq("agency_id", ctx.agencyId);
  revalidatePath("/revenue");
}

export async function recordRevenueEvent(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const ctx = await adminCtx();
  if (!ctx) return { error: "Not authorized." };
  const parsed = revenueEventSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = supabaseServer();
  const { error } = await supabase.from("revenue_events").insert({
    agency_id: ctx.agencyId,
    client_id: parsed.data.client_id,
    subscription_id: parsed.data.subscription_id ?? null,
    type: parsed.data.type,
    amount: parsed.data.amount,
    payment_status: parsed.data.payment_status,
  });
  if (error) return { error: "Could not record event." };
  revalidatePath("/revenue");
  return { ok: true };
}
