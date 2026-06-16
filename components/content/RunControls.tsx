"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

// Triggers the orchestrator via the pipeline route handler.
export function RunControls({ projectId }: { projectId: string }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  async function run() {
    setBusy(true);
    setMsg("Running pipeline… this calls Claude per agent and may take a minute.");
    try {
      const res = await fetch("/api/pipeline/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(`Error: ${data.error ?? res.statusText}`);
      } else if (data.stoppedAt) {
        setMsg(`Stopped at ${data.stoppedAt}: ${data.reason}. Ran: ${(data.ran ?? []).join(", ") || "none"}.`);
      } else {
        setMsg(`Pipeline complete. Status: ${data.status}. Ran: ${(data.ran ?? []).join(", ") || "none (all done)"}.`);
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
      startTransition(() => router.refresh());
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={run}
        disabled={busy}
        className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        {busy ? "Running…" : "Run pipeline"}
      </button>
      {msg && <p className="text-xs text-neutral-500">{msg}</p>}
      <p className="text-xs text-neutral-400">
        Requires <code>ANTHROPIC_API_KEY</code>. Runs agents that haven&apos;t produced output yet,
        stopping at the Authenticity (≥90) or Compliance gate.
      </p>
    </div>
  );
}
