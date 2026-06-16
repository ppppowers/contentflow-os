"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { recordIntakeFile } from "@/lib/actions/intake";

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

// Direct browser → Storage upload (RLS-scoped by agency path prefix),
// then records the DB row via server action.
export function FileUpload({
  agencyId,
  clientId,
  submissionId,
}: {
  agencyId: string;
  clientId: string;
  submissionId: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setError(null);
    setBusy(true);
    const supabase = createClient();

    try {
      for (const file of files) {
        if (file.size > MAX_BYTES) {
          setError(`${file.name} exceeds 25 MB.`);
          continue;
        }
        const path = `${agencyId}/${clientId}/${submissionId}/${crypto.randomUUID()}-${sanitize(file.name)}`;
        const { error: upErr } = await supabase.storage.from("intake").upload(path, file, {
          contentType: file.type || undefined,
          upsert: false,
        });
        if (upErr) {
          setError(`Upload failed: ${file.name}`);
          continue;
        }
        const res = await recordIntakeFile(clientId, submissionId, {
          storage_path: path,
          file_name: file.name,
          mime_type: file.type,
          size_bytes: file.size,
        });
        if ("error" in res) setError(res.error);
      }
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
      startTransition(() => router.refresh());
    }
  }

  return (
    <div className="space-y-2">
      <input ref={inputRef} type="file" multiple onChange={onChange} disabled={busy || pending} className="text-sm" />
      {(busy || pending) && <p className="text-xs text-neutral-500">Uploading…</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
      <p className="text-xs text-neutral-400">Up to 25 MB per file.</p>
    </div>
  );
}
