"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { recordVaultDocument } from "@/lib/actions/vault";
import { VAULT_DOC_TYPES, VAULT_DOC_TYPE_LABELS } from "@/lib/validation/vault";

const MAX_BYTES = 25 * 1024 * 1024;

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

// Direct browser → Storage upload (RLS-scoped by agency path), then record the row.
export function VaultUpload({ agencyId, clientId }: { agencyId: string; clientId: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState<string>("other");
  const [tags, setTags] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  async function submit() {
    const file = fileRef.current?.files?.[0];
    if (!file) return setError("Choose a file.");
    if (file.size > MAX_BYTES) return setError("File exceeds 25 MB.");
    setError(null);
    setBusy(true);
    try {
      const supabase = createClient();
      const path = `${agencyId}/${clientId}/${crypto.randomUUID()}-${sanitize(file.name)}`;
      const { error: upErr } = await supabase.storage.from("vault").upload(path, file, {
        contentType: file.type || undefined,
        upsert: false,
      });
      if (upErr) return setError("Upload failed.");

      const res = await recordVaultDocument(clientId, {
        title: title.trim() || file.name,
        doc_type: docType,
        tags: tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean),
        storage_path: path,
        file_name: file.name,
        mime_type: file.type,
        size_bytes: file.size,
      });
      if ("error" in res) return setError(res.error);

      setTitle("");
      setTags("");
      if (fileRef.current) fileRef.current.value = "";
      startTransition(() => router.refresh());
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-neutral-200 p-4">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (defaults to file name)"
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          {VAULT_DOC_TYPES.map((t) => (
            <option key={t} value={t}>{VAULT_DOC_TYPE_LABELS[t]}</option>
          ))}
        </select>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="tags, comma, separated"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>
      <input ref={fileRef} type="file" className="text-sm" disabled={busy} />
      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-400">Up to 25 MB. PDFs/images can be analyzed by Claude.</p>
        <button
          onClick={submit}
          disabled={busy}
          className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {busy ? "Uploading…" : "Upload"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
