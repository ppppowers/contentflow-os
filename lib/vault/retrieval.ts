import { createClient } from "@/lib/supabase/server";

export type VaultDoc = {
  id: string;
  client_id: string | null;
  title: string;
  doc_type: string;
  summary: string;
  tags: string[];
  analyzed: boolean;
};

// Full-text search over the vault. Scoped by RLS to the agency; within that,
// returns docs for the given client PLUS agency-wide docs (client_id null).
// Empty query → most recent docs (browse mode).
export async function searchVault(
  query: string,
  opts: { clientId?: string | null; limit?: number } = {},
): Promise<VaultDoc[]> {
  const supabase = createClient();
  let q = supabase
    .from("vault_documents")
    .select("id, client_id, title, doc_type, summary, tags, analyzed")
    .limit(opts.limit ?? 20);

  // Client docs + agency-wide docs.
  if (opts.clientId) q = q.or(`client_id.eq.${opts.clientId},client_id.is.null`);

  if (query.trim()) {
    q = q.textSearch("search", query, { type: "websearch", config: "english" });
  } else {
    q = q.order("created_at", { ascending: false });
  }

  const { data } = await q;
  return (data as VaultDoc[] | null) ?? [];
}

// Pure: format retrieved docs into a prompt-ready block. Empty → "".
export function buildVaultContextText(docs: VaultDoc[]): string {
  if (docs.length === 0) return "";
  const lines = docs.map((d) => {
    const tags = d.tags.length > 0 ? ` [${d.tags.join(", ")}]` : "";
    const summary = d.summary?.trim() ? ` — ${d.summary.trim()}` : "";
    return `- (${d.doc_type}) ${d.title}${summary}${tags}`;
  });
  return lines.join("\n");
}

// Generation hook: search the vault with the run's topic text, return a context
// block. Satisfies "Claude must search the Knowledge Vault before writing."
export async function getVaultContext(
  clientId: string | null,
  queryText: string,
  limit = 5,
): Promise<string> {
  const docs = await searchVault(queryText, { clientId, limit });
  return buildVaultContextText(docs);
}
