"use server";

import { revalidatePath } from "next/cache";
import { createClient as supabaseServer } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/guards";
import { isStaff } from "@/lib/auth/roles";
import { storyFormSchema, type StoryCategory } from "@/lib/validation/story";
import { currentPeriod } from "@/lib/validation/intake";
import { ensureSubmission } from "@/lib/actions/intake";
import { getStory } from "@/lib/data/story";

export type ActionResult = { error: string } | { ok: true };

async function staffContext() {
  const ctx = await getSessionContext();
  if (!ctx || !isStaff(ctx.role)) return null;
  return ctx;
}

export async function addStory(clientId: string, _prev: unknown, formData: FormData): Promise<ActionResult> {
  const ctx = await staffContext();
  if (!ctx) return { error: "Not authorized." };

  const parsed = storyFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = supabaseServer();
  const { error } = await supabase.from("stories").insert({
    agency_id: ctx.agencyId,
    client_id: clientId,
    category: parsed.data.category,
    title: parsed.data.title,
    summary: parsed.data.summary ?? "",
    detail: parsed.data.detail ?? "",
    tags: parsed.data.tags,
    source: "manual",
    created_by: ctx.userId,
  });
  if (error) return { error: "Could not save story." };

  revalidatePath(`/clients/${clientId}/stories`);
  return { ok: true };
}

export async function setStoryStatus(clientId: string, storyId: string, status: string): Promise<void> {
  const ctx = await staffContext();
  if (!ctx) return;
  const supabase = supabaseServer();
  await supabase.from("stories").update({ status }).eq("id", storyId).eq("agency_id", ctx.agencyId);
  revalidatePath(`/clients/${clientId}/stories`);
}

export async function deleteStory(clientId: string, storyId: string): Promise<void> {
  const ctx = await staffContext();
  if (!ctx) return;
  const supabase = supabaseServer();
  await supabase.from("stories").delete().eq("id", storyId).eq("agency_id", ctx.agencyId);
  revalidatePath(`/clients/${clientId}/stories`);
}

const STORY_TO_INTAKE: Record<StoryCategory, string> = {
  customer: "customer_story",
  volunteer: "volunteer_story",
  donor: "donor_story",
  employee: "team_update",
  project_success: "project_complete",
};

// Push a banked story into this month's intake → flows into the content pipeline.
export async function sendStoryToIntake(clientId: string, storyId: string): Promise<void> {
  const ctx = await staffContext();
  if (!ctx) return;
  const story = await getStory(storyId);
  if (!story) return;

  const ensured = await ensureSubmission(clientId, currentPeriod());
  if ("error" in ensured) return;

  const supabase = supabaseServer();
  await supabase.from("intake_items").insert({
    agency_id: ctx.agencyId,
    submission_id: ensured.submissionId,
    type: STORY_TO_INTAKE[story.category as StoryCategory] ?? "customer_story",
    title: story.title.slice(0, 200),
    body: [story.summary, story.detail].filter(Boolean).join("\n\n"),
  });
  await supabase.from("stories").update({ status: "used" }).eq("id", storyId).eq("agency_id", ctx.agencyId);

  revalidatePath(`/clients/${clientId}/stories`);
  revalidatePath(`/clients/${clientId}/intake`);
}
