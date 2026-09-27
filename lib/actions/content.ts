"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient as supabaseServer } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/guards";
import { isStaff } from "@/lib/auth/roles";
import { pieceEditSchema } from "@/lib/validation/content";

export type ActionResult = { error: string } | { ok: true };

// Spawn a content project from a reviewed intake submission → enters the pipeline.
export async function createProjectFromSubmission(
  clientId: string,
  submissionId: string,
): Promise<void> {
  const ctx = await getSessionContext();
  if (!ctx || !isStaff(ctx.role)) return;

  const supabase = supabaseServer();
  const { data: client } = await supabase.from("clients").select("name").eq("id", clientId).maybeSingle();
  const { data: sub } = await supabase
    .from("intake_submissions")
    .select("period")
    .eq("id", submissionId)
    .maybeSingle();

  const period = (sub?.period as string) ?? null;
  const title = `${client?.name ?? "Client"} — ${period ? new Date(period).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }) : "Content"}`;

  const { data, error } = await supabase
    .from("content_projects")
    .insert({
      agency_id: ctx.agencyId,
      client_id: clientId,
      submission_id: submissionId,
      period,
      title,
      status: "intake_received",
      created_by: ctx.userId,
    })
    .select("id")
    .single();
  if (error || !data) return;

  revalidatePath("/content");
  redirect(`/content/${data.id}`);
}

// Manual per-piece edit. Builds channel-appropriate metadata from the form.
export async function updatePiece(
  projectId: string,
  pieceId: string,
  channel: string,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await getSessionContext();
  if (!ctx || !isStaff(ctx.role)) return { error: "Not authorized." };

  const parsed = pieceEditSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const v = parsed.data;

  let metadata: Record<string, unknown> = {};
  if (channel === "newsletter") {
    metadata = { subjectLines: v.subjectLines ?? [], previewText: v.previewText ?? "" };
  } else if (channel === "blog") {
    metadata = {
      seoTitle: v.seoTitle ?? "",
      metaDescription: v.metaDescription ?? "",
      slug: v.slug ?? "",
      keywords: v.keywords ?? [],
    };
  }

  const supabase = supabaseServer();
  const { error } = await supabase
    .from("content_pieces")
    .update({ body: v.body, metadata, status: "edited" })
    .eq("id", pieceId)
    .eq("agency_id", ctx.agencyId);
  if (error) return { error: "Could not save piece." };

  revalidatePath(`/content/${projectId}`);
  return { ok: true };
}

export async function archiveProject(projectId: string): Promise<void> {
  const ctx = await getSessionContext();
  if (!ctx || !isStaff(ctx.role)) return;
  const supabase = supabaseServer();
  await supabase.from("content_projects").update({ status: "archived" }).eq("id", projectId);
  revalidatePath("/content");
  revalidatePath(`/content/${projectId}`);
}

export async function unarchiveProject(projectId: string): Promise<void> {
  const ctx = await getSessionContext();
  if (!ctx || !isStaff(ctx.role)) return;
  const supabase = supabaseServer();
  await supabase.from("content_projects").update({ status: "approved" }).eq("id", projectId);
  revalidatePath("/content");
  revalidatePath(`/content/${projectId}`);
}

// Remove one generated image (row + stored file).
export async function deleteImage(projectId: string, imageId: string): Promise<void> {
  const ctx = await getSessionContext();
  if (!ctx || !isStaff(ctx.role)) return;
  const supabase = supabaseServer();
  const { data } = await supabase
    .from("content_images")
    .select("storage_path")
    .eq("id", imageId)
    .eq("project_id", projectId)
    .maybeSingle();
  if (!data) return;
  await supabase.storage.from("content-images").remove([data.storage_path as string]);
  await supabase.from("content_images").delete().eq("id", imageId);
  revalidatePath(`/content/${projectId}`);
}
