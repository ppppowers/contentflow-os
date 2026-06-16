"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

// Run the Client Interview Agent on a submission → Monthly Intelligence Brief.
export function GenerateBriefButton({ submissionId, hasBrief }: { submissionId: string; hasBrief: boolean }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  async function run() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId }),
      });
      const data = await res.json();
      if (!res.ok || data.ok === false) setErr(data.error ?? "Failed");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
      startTransition(() => router.refresh());
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        onClick={run}
        disabled={busy}
        className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        {busy ? "Interviewing…" : hasBrief ? "Regenerate brief" : "Generate Intelligence Brief"}
      </button>
      {err && <span className="text-xs text-red-600">{err}</span>}
    </span>
  );
}
