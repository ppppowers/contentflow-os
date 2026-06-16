import { requireStaff } from "@/lib/auth/guards";
import { searchVault } from "@/lib/vault/retrieval";
import { listVaultDocuments, signedVaultUrl, type VaultDocRow } from "@/lib/data/vault";
import { deleteVaultDocument } from "@/lib/actions/vault";
import { VaultUpload } from "@/components/vault/VaultUpload";
import { AnalyzeButton } from "@/components/vault/AnalyzeButton";
import { VAULT_DOC_TYPE_LABELS, type VaultDocType } from "@/lib/validation/vault";
import { Badge } from "@/components/ui/badge";

export default async function VaultPage({
  params,
  searchParams,
}: {
  params: { clientId: string };
  searchParams: { q?: string };
}) {
  const ctx = await requireStaff();
  const query = searchParams.q?.trim() ?? "";

  // Search mode returns id matches; browse mode lists everything. Hydrate full rows.
  const all = await listVaultDocuments(params.clientId);
  let docs: VaultDocRow[] = all;
  if (query) {
    const matches = await searchVault(query, { clientId: params.clientId, limit: 50 });
    const ids = new Set(matches.map((m) => m.id));
    docs = all.filter((d) => ids.has(d.id));
  }

  const withUrls = await Promise.all(
    docs.map(async (d) => ({ doc: d, url: await signedVaultUrl(d.storage_path) })),
  );

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-neutral-900">Knowledge Vault</h3>
        <p className="text-xs text-neutral-500">
          Brand guides, SOPs, flyers, brochures, logos, notes. Claude searches these before writing.
        </p>
      </div>

      <VaultUpload agencyId={ctx.agencyId} clientId={params.clientId} />

      <form className="flex gap-2" action={`/clients/${params.clientId}/vault`}>
        <input
          name="q"
          defaultValue={query}
          placeholder="Search the vault…"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <button className="rounded-md border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50">Search</button>
      </form>

      {withUrls.length === 0 ? (
        <p className="text-sm text-neutral-400">{query ? "No documents match." : "No documents yet."}</p>
      ) : (
        <ul className="space-y-2">
          {withUrls.map(({ doc, url }) => {
            const del = deleteVaultDocument.bind(null, params.clientId, doc.id);
            return (
              <li key={doc.id} className="rounded-lg border border-neutral-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-neutral-900">{doc.title}</span>
                      <Badge tone="neutral">{VAULT_DOC_TYPE_LABELS[doc.doc_type as VaultDocType] ?? doc.doc_type}</Badge>
                      {doc.client_id === null && <Badge tone="blue">agency-wide</Badge>}
                      {doc.analyzed ? <Badge tone="green">analyzed</Badge> : <Badge tone="amber">not analyzed</Badge>}
                    </div>
                    {doc.summary && <p className="text-sm text-neutral-700">{doc.summary}</p>}
                    {doc.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {doc.tags.map((t) => (
                          <span key={t} className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-600">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {url && (
                      <a href={url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                        download
                      </a>
                    )}
                    <AnalyzeButton docId={doc.id} analyzed={doc.analyzed} />
                    <form action={del}>
                      <button className="text-xs text-red-600 hover:underline">delete</button>
                    </form>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
