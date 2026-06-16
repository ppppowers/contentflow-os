"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

// Run Red Team or full multi-layer QA on a project.
export function QAControls({ projectId }: { projectId: string }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  async function run(kind: "redteam" | "qa") {
    setBusy(kind);
    setErr(null);
    try {
      const res = await fetch(`/api/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();
      if (!res.ok || data.ok === false) setErr(data.error ?? "Failed");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
      startTransition(() => router.refresh());
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={() => run("redteam")} disabled={!!busy} className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50">
        {busy === "redteam" ? "Red teaming…" : "Run Red Team"}
      </button>
      <button onClick={() => run("qa")} disabled={!!busy} className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50">
        {busy === "qa" ? "Running QA…" : "Run full QA"}
      </button>
      {err && <span className="text-xs text-red-600">{err}</span>}
    </div>
  );
}
