"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Runs a long server step (POST url, JSON body), shows elapsed time, refreshes the page.
export function StepButton({
  url,
  body,
  label,
  busyLabel,
  expect,
  variant = "primary",
  autoStart = false,
  onDone,
}: {
  url: string;
  body: Record<string, unknown>;
  label: string;
  busyLabel: string;
  expect?: string;
  variant?: "primary" | "secondary";
  autoStart?: boolean;
  onDone?: (data: Record<string, unknown>) => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [secs, setSecs] = useState(0);
  const started = useRef(false);

  async function run() {
    setBusy(true);
    setErr(null);
    setSecs(0);
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setErr(data.error || (data.errors ?? []).join("; ") || `Failed (${res.status})`);
      else onDone?.(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Request failed");
    } finally {
      clearInterval(t);
      setBusy(false);
      router.refresh();
    }
  }

  useEffect(() => {
    if (autoStart && !started.current) {
      started.current = true;
      void run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  const cls =
    variant === "primary"
      ? "rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
      : "rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50 disabled:opacity-50";

  return (
    <div className="space-y-1">
      <button onClick={run} disabled={busy} className={cls}>
        {busy ? `${busyLabel} ${secs}s` : label}
      </button>
      {busy && expect && <p className="text-xs text-neutral-400">{expect}</p>}
      {err && <p className="text-xs text-red-600">{err}</p>}
    </div>
  );
}
