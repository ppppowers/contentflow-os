"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient as supabaseServer } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/guards";
import { isStaff } from "@/lib/auth/roles";
import { quickCreateSchema, weekLabel } from "@/lib/validation/create";

export type ActionResult = { error: string } | { ok: true };

// One step from "what's this week about?" to a content project. Optionally creates
// the client and a starter brand profile. The page it redirects to starts the pipeline.
export async function quickCreateProject(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const ctx = await getSessionContext();
  if (!ctx || !isStaff(ctx.role)) return { error: "Not authorized." };

  const parsed = quickCreateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const v = parsed.data;

  const supabase = supabaseServer();

  let clientId = v.clientId;
  let clientName: string;
  if (clientId === "new") {
    const { data, error } = await supabase
      .from("clients")
      .insert({
        agency_id: ctx.agencyId,
        name: v.newClientName!,
        website_url: v.newClientWebsite ?? null,
        industry: v.newClientIndustry ?? null,
      })
      .select("id, name")
      .single();
    if (error || !data) return { error: "Could not create the client." };
    clientId = data.id as string;
    clientName = data.name as string;
  } else {
    // RLS scopes this to the caller's agency.
    const { data } = await supabase.from("clients").select("id, name").eq("id", clientId).maybeSingle();
    if (!data) return { error: "That client wasn't found." };
    clientName = data.name as string;
  }

  // Starter brand profile, only when the client doesn't have one yet.
  if (v.voice || v.audience) {
    const { data: brand } = await supabase
      .from("brand_profiles")
      .select("id")
      .eq("client_id", clientId)
      .eq("is_active", true)
      .maybeSingle();
    if (!brand) {
      await supabase.from("brand_profiles").insert({
        agency_id: ctx.agencyId,
        client_id: clientId,
        voice_summary: v.voice ?? null,
        audience: v.audience ?? null,
      });
    }
  }

  const { data: project, error } = await supabase
    .from("content_projects")
    .insert({
      agency_id: ctx.agencyId,
      client_id: clientId,
      title: `${clientName} — ${weekLabel()}`,
      brief: v.brief,
      options: { images: v.images },
      status: "intake_received",
      created_by: ctx.userId,
    })
    .select("id")
    .single();
  if (error?.code === "42703" || error?.code === "PGRST204") {
    return { error: "The database needs a quick update first: apply migration 0031_quick_create_and_images.sql in Supabase." };
  }
  if (error || !project) return { error: "Could not create the content project." };

  revalidatePath("/content");
  redirect(`/content/${project.id}?run=1`);
}
