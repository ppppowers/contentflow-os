"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { recordIntakeFile } from "@/lib/actions/intake";
import { ensureCurrentSubmission } from "@/lib/actions/harvest";

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB (video/audio)

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

// Photos / videos / voice notes → this month's submission. Ensures the submission
// exists first (its id is part of the storage path). Transcription is Phase 9.
export function HarvestMedia({ agencyId, clientId }: { agencyId: string; clientId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setError(null);
    setBusy(true);
    try {
      const ensured = await ensureCurrentSubmission(clientId);
      if ("error" in ensured) return setError(ensured.error);
      const submissionId = ensured.submissionId;

      const supabase = createClient();
      for (const file of files) {
        if (file.size > MAX_BYTES) {
          setError(`${file.name} exceeds 50 MB.`);
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
    <div className="space-y-2 rounded-lg border border-neutral-200 p-4">
      <p className="text-sm font-medium text-neutral-900">Photos · Videos · Voice notes</p>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*"
        onChange={onChange}
        disabled={busy}
        className="text-sm"
      />
      {busy && <p className="text-xs text-neutral-500">Uploading…</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
      <p className="text-xs text-neutral-400">Up to 50 MB. Attached to this month's intake.</p>
    </div>
  );
}
