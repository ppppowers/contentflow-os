import { createClient } from "@/lib/supabase/server";

export async function getSubmission(clientId: string, period: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("intake_submissions")
    .select("id, period, status, created_at")
    .eq("client_id", clientId)
    .eq("period", period)
    .maybeSingle();
  return data;
}

export async function listSubmissions(clientId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("intake_submissions")
    .select("id, period, status")
    .eq("client_id", clientId)
    .order("period", { ascending: false });
  return data ?? [];
}

export async function listItems(submissionId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("intake_items")
    .select("id, type, title, body, created_at")
    .eq("submission_id", submissionId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function listFiles(submissionId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("intake_files")
    .select("id, file_name, mime_type, size_bytes, storage_path")
    .eq("submission_id", submissionId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

// Short-lived signed URL for downloading a private intake file.
export async function signedFileUrl(storagePath: string): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.storage.from("intake").createSignedUrl(storagePath, 60 * 10);
  return data?.signedUrl ?? null;
}
