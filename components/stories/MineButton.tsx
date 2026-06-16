"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

// Run the Story Mining Agent for a client.
export function MineButton({ clientId }: { clientId: string }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  async function run() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/stories/mine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      const data = await res.json();
      if (!res.ok || data.ok === false) setMsg(data.error ?? "Failed");
      else setMsg(data.added > 0 ? `Found ${data.added} new ${data.added === 1 ? "story" : "stories"}.` : "No new stories found.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
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
        {busy ? "Mining…" : "Mine stories"}
      </button>
      {msg && <span className="text-xs text-neutral-500">{msg}</span>}
    </span>
  );
}
