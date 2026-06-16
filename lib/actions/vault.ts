"use server";

import { revalidatePath } from "next/cache";
import { createClient as supabaseServer } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/guards";
import { isStaff } from "@/lib/auth/roles";
import { recordVaultDocSchema } from "@/lib/validation/vault";

export type ActionResult = { error: string } | { ok: true };

async function staffContext() {
  const ctx = await getSessionContext();
  if (!ctx || !isStaff(ctx.role)) return null;
  return ctx;
}

// Record a vault document after a successful direct-to-storage upload.
export async function recordVaultDocument(
  clientId: string,
  payload: {
    title: string;
    doc_type: string;
    tags: string[];
    storage_path: string;
    file_name: string;
    mime_type: string;
    size_bytes: number;
  },
): Promise<ActionResult> {
  const ctx = await staffContext();
  if (!ctx) return { error: "Not authorized." };

  const parsed = recordVaultDocSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  // Path is agency-scoped by RLS; verify the prefix matches this agency.
  if (!parsed.data.storage_path.startsWith(`${ctx.agencyId}/`)) {
    return { error: "Invalid storage path." };
  }

  const supabase = supabaseServer();
  const { error } = await supabase.from("vault_documents").insert({
    agency_id: ctx.agencyId,
    client_id: clientId,
    title: parsed.data.title,
    doc_type: parsed.data.doc_type,
    tags: parsed.data.tags,
    storage_path: parsed.data.storage_path,
    file_name: parsed.data.file_name,
    mime_type: parsed.data.mime_type || null,
    size_bytes: parsed.data.size_bytes ?? null,
    created_by: ctx.userId,
  });
  if (error) return { error: "Could not record document." };

  revalidatePath(`/clients/${clientId}/vault`);
  return { ok: true };
}

export async function updateVaultTags(clientId: string, docId: string, tagsCsv: string): Promise<void> {
  const ctx = await staffContext();
  if (!ctx) return;
  const tags = tagsCsv.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
  const supabase = supabaseServer();
  await supabase.from("vault_documents").update({ tags }).eq("id", docId).eq("agency_id", ctx.agencyId);
  revalidatePath(`/clients/${clientId}/vault`);
}

export async function deleteVaultDocument(clientId: string, docId: string): Promise<void> {
  const ctx = await staffContext();
  if (!ctx) return;
  const supabase = supabaseServer();
  const { data: doc } = await supabase
    .from("vault_documents")
    .select("storage_path")
    .eq("id", docId)
    .eq("agency_id", ctx.agencyId)
    .maybeSingle();
  if (doc?.storage_path) await supabase.storage.from("vault").remove([doc.storage_path as string]);
  await supabase.from("vault_documents").delete().eq("id", docId).eq("agency_id", ctx.agencyId);
  revalidatePath(`/clients/${clientId}/vault`);
}
