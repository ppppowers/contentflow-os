"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient as supabaseServer, createServiceClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/guards";
import { isStaff } from "@/lib/auth/roles";
import { harvestProject } from "@/lib/agency-brain/learn";

export type ActionResult = { error: string } | { ok: true };

const decisionSchema = z.object({
  decision: z.enum(["approved", "changes_requested"]),
  comment: z.string().trim().optional(),
});

// ---- Internal (staff) review --------------------------------------------------

export async function internalDecision(
  projectId: string,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await getSessionContext();
  if (!ctx || !isStaff(ctx.role)) return { error: "Not authorized." };

  const parsed = decisionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid decision." };
  const { decision, comment } = parsed.data;

  const supabase = supabaseServer();
  await supabase.from("approvals").insert({
    agency_id: ctx.agencyId,
    project_id: projectId,
    stage: "internal",
    decision,
    decided_by: ctx.userId,
    comment: comment ?? null,
  });

  if (decision === "approved") {
    // Open a pending client-stage approval and hand off to the client.
    await supabase.from("approvals").insert({
      agency_id: ctx.agencyId,
      project_id: projectId,
      stage: "client",
      decision: "pending",
    });
    await supabase.from("content_projects").update({ status: "client_review" }).eq("id", projectId);
  } else {
    await supabase.from("revisions").insert({
      agency_id: ctx.agencyId,
      project_id: projectId,
      requested_by: ctx.userId,
      scope: "internal",
      instructions: comment ?? "Changes requested.",
      status: "open",
    });
    await supabase.from("content_projects").update({ status: "revision_requested" }).eq("id", projectId);
  }

  revalidatePath(`/content/${projectId}`);
  return { ok: true };
}

// Re-submit a revised project back into internal review.
export async function resubmitForReview(projectId: string): Promise<void> {
  const ctx = await getSessionContext();
  if (!ctx || !isStaff(ctx.role)) return;
  const supabase = supabaseServer();
  await supabase.from("content_projects").update({ status: "internal_review" }).eq("id", projectId);
  revalidatePath(`/content/${projectId}`);
}

export async function markRevisionAddressed(projectId: string, revisionId: string): Promise<void> {
  const ctx = await getSessionContext();
  if (!ctx || !isStaff(ctx.role)) return;
  const supabase = supabaseServer();
  await supabase
    .from("revisions")
    .update({ status: "addressed" })
    .eq("id", revisionId)
    .eq("agency_id", ctx.agencyId);
  revalidatePath(`/content/${projectId}`);
}

// ---- Client review ------------------------------------------------------------
// Clients can't write content_projects/revisions under RLS. Verify ownership via
// client_user_links, then use the service client for the status transition.

export async function clientDecision(
  projectId: string,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await getSessionContext();
  if (!ctx || ctx.role !== "client") return { error: "Not authorized." };

  const parsed = decisionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid decision." };
  const { decision, comment } = parsed.data;

  // RLS-scoped reads: a client only sees their own project + link.
  const supabase = supabaseServer();
  const { data: proj } = await supabase
    .from("content_projects")
    .select("agency_id, client_id, status")
    .eq("id", projectId)
    .maybeSingle();
  if (!proj) return { error: "Not found." };
  if (proj.status !== "client_review") return { error: "Not open for client review." };

  const { data: link } = await supabase
    .from("client_user_links")
    .select("id")
    .eq("client_id", proj.client_id)
    .maybeSingle();
  if (!link) return { error: "Not authorized for this client." };

  // Controlled elevation after ownership check.
  const admin = createServiceClient();
  await admin
    .from("approvals")
    .update({ decision, decided_by: ctx.userId, comment: comment ?? null })
    .eq("project_id", projectId)
    .eq("stage", "client")
    .eq("decision", "pending");

  if (decision === "approved") {
    await admin.from("content_projects").update({ status: "approved" }).eq("id", projectId);
    // Learning engine: harvest this winning project into the Agency Brain.
    // Client role can't write agency_brain under RLS → use the elevated client.
    await harvestProject(projectId, admin, { agencyId: proj.agency_id as string });
  } else {
    await admin.from("revisions").insert({
      agency_id: proj.agency_id,
      project_id: projectId,
      requested_by: ctx.userId,
      scope: "client",
      instructions: comment ?? "Changes requested.",
      status: "open",
    });
    await admin.from("content_projects").update({ status: "revision_requested" }).eq("id", projectId);
  }

  revalidatePath(`/review/${projectId}`);
  revalidatePath(`/content/${projectId}`);
  return { ok: true };
}
