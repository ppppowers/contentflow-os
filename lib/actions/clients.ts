"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient as supabaseServer } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/guards";
import { isStaff } from "@/lib/auth/roles";
import {
  clientSchema,
  contactSchema,
  noteSchema,
  brandProfileSchema,
} from "@/lib/validation/client";

export type ActionResult = { error: string } | { ok: true };

async function staffContext() {
  const ctx = await getSessionContext();
  if (!ctx || !isStaff(ctx.role)) return null;
  return ctx;
}

// ---- Clients ----------------------------------------------------------------

export async function createClientRecord(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const ctx = await staffContext();
  if (!ctx) return { error: "Not authorized." };

  const parsed = clientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("clients")
    .insert({ ...parsed.data, agency_id: ctx.agencyId })
    .select("id")
    .single();
  if (error || !data) return { error: "Could not create client." };

  revalidatePath("/clients");
  redirect(`/clients/${data.id}`);
}

export async function updateClientRecord(clientId: string, _prev: unknown, formData: FormData): Promise<ActionResult> {
  const ctx = await staffContext();
  if (!ctx) return { error: "Not authorized." };

  const parsed = clientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = supabaseServer();
  // RLS already scopes to agency; the eq is belt-and-suspenders.
  const { error } = await supabase
    .from("clients")
    .update(parsed.data)
    .eq("id", clientId)
    .eq("agency_id", ctx.agencyId);
  if (error) return { error: "Could not update client." };

  revalidatePath(`/clients/${clientId}`);
  return { ok: true };
}

export async function deleteClientRecord(clientId: string): Promise<void> {
  const ctx = await staffContext();
  if (!ctx) return;
  const supabase = supabaseServer();
  await supabase.from("clients").delete().eq("id", clientId).eq("agency_id", ctx.agencyId);
  revalidatePath("/clients");
  redirect("/clients");
}

// ---- Brand profile (one active row per client; upsert) ----------------------

export async function saveBrandProfile(clientId: string, _prev: unknown, formData: FormData): Promise<ActionResult> {
  const ctx = await staffContext();
  if (!ctx) return { error: "Not authorized." };

  const parsed = brandProfileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const v = parsed.data;

  const supabase = supabaseServer();
  const { data: existing } = await supabase
    .from("brand_profiles")
    .select("id, version")
    .eq("client_id", clientId)
    .eq("is_active", true)
    .maybeSingle();

  const payload = {
    agency_id: ctx.agencyId,
    client_id: clientId,
    voice_summary: v.voice_summary ?? null,
    tone_descriptors: v.tone_descriptors,
    audience: v.audience ?? null,
    products_services: v.products_services,
    sample_copy: v.sample_copy ?? null,
    banned_phrases: v.banned_phrases,
    required_disclaimers: v.required_disclaimers,
    reading_level: v.reading_level ?? null,
    is_active: true,
  };

  if (existing) {
    const { error } = await supabase.from("brand_profiles").update(payload).eq("id", existing.id);
    if (error) return { error: "Could not save brand profile." };
  } else {
    const { error } = await supabase.from("brand_profiles").insert(payload);
    if (error) return { error: "Could not create brand profile." };
  }

  revalidatePath(`/clients/${clientId}/brand`);
  return { ok: true };
}

// ---- Contacts ---------------------------------------------------------------

export async function addContact(clientId: string, _prev: unknown, formData: FormData): Promise<ActionResult> {
  const ctx = await staffContext();
  if (!ctx) return { error: "Not authorized." };

  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = supabaseServer();
  // Only one primary per client.
  if (parsed.data.is_primary) {
    await supabase.from("client_contacts").update({ is_primary: false }).eq("client_id", clientId);
  }
  const { error } = await supabase
    .from("client_contacts")
    .insert({ ...parsed.data, client_id: clientId, agency_id: ctx.agencyId });
  if (error) return { error: "Could not add contact." };

  revalidatePath(`/clients/${clientId}/contacts`);
  return { ok: true };
}

export async function deleteContact(clientId: string, contactId: string): Promise<void> {
  const ctx = await staffContext();
  if (!ctx) return;
  const supabase = supabaseServer();
  await supabase.from("client_contacts").delete().eq("id", contactId).eq("agency_id", ctx.agencyId);
  revalidatePath(`/clients/${clientId}/contacts`);
}

// ---- Notes ------------------------------------------------------------------

export async function addNote(clientId: string, _prev: unknown, formData: FormData): Promise<ActionResult> {
  const ctx = await staffContext();
  if (!ctx) return { error: "Not authorized." };

  const parsed = noteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = supabaseServer();
  const { error } = await supabase.from("client_notes").insert({
    ...parsed.data,
    client_id: clientId,
    agency_id: ctx.agencyId,
    author_id: ctx.userId,
  });
  if (error) return { error: "Could not add note." };

  revalidatePath(`/clients/${clientId}/notes`);
  return { ok: true };
}

export async function deleteNote(clientId: string, noteId: string): Promise<void> {
  const ctx = await staffContext();
  if (!ctx) return;
  const supabase = supabaseServer();
  await supabase.from("client_notes").delete().eq("id", noteId).eq("agency_id", ctx.agencyId);
  revalidatePath(`/clients/${clientId}/notes`);
}
