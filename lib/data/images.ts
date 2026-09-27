import { createClient } from "@/lib/supabase/server";
import { IMAGE_BUCKET } from "@/lib/images/service";

export type ContentImage = {
  id: string;
  channel: string | null;
  prompt: string;
  url: string | null;
  created_at: string;
};

// Images for a project, newest first, with short-lived signed URLs (private bucket).
export async function listProjectImages(projectId: string): Promise<ContentImage[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("content_images")
    .select("id, channel, prompt, storage_path, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  const rows = (data as { id: string; channel: string | null; prompt: string; storage_path: string; created_at: string }[]) ?? [];
  if (rows.length === 0) return [];

  const { data: signed } = await supabase.storage
    .from(IMAGE_BUCKET)
    .createSignedUrls(rows.map((r) => r.storage_path), 60 * 60);
  const byPath = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));
  return rows.map((r) => ({
    id: r.id,
    channel: r.channel,
    prompt: r.prompt,
    url: byPath.get(r.storage_path) ?? null,
    created_at: r.created_at,
  }));
}
