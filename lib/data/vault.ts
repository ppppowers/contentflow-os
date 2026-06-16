import { createClient } from "@/lib/supabase/server";

export type VaultDocRow = {
  id: string;
  client_id: string | null;
  title: string;
  doc_type: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  tags: string[];
  summary: string;
  analyzed: boolean;
  storage_path: string;
  created_at: string;
};

// All vault docs for a client + agency-wide docs (management/browse view).
export async function listVaultDocuments(clientId: string): Promise<VaultDocRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("vault_documents")
    .select("id, client_id, title, doc_type, file_name, mime_type, size_bytes, tags, summary, analyzed, storage_path, created_at")
    .or(`client_id.eq.${clientId},client_id.is.null`)
    .order("created_at", { ascending: false });
  return (data as VaultDocRow[] | null) ?? [];
}

// Short-lived signed URL for a private vault object.
export async function signedVaultUrl(storagePath: string): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.storage.from("vault").createSignedUrl(storagePath, 60 * 10);
  return data?.signedUrl ?? null;
}
