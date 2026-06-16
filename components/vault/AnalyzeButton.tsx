"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

// Trigger Claude document intelligence for a vault doc.
export function AnalyzeButton({ docId, analyzed }: { docId: string; analyzed: boolean }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  async function run() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/vault/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId }),
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
    <span className="inline-flex items-center gap-1">
      <button onClick={run} disabled={busy} className="text-xs text-blue-600 hover:underline disabled:opacity-50">
        {busy ? "analyzing…" : analyzed ? "re-analyze" : "analyze"}
      </button>
      {err && <span className="text-xs text-red-600">{err}</span>}
    </span>
  );
}
