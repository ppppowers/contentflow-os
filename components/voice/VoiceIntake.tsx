"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MEETING_SOURCES, MEETING_SOURCE_LABELS } from "@/lib/validation/voice";

// Capture a transcript (paste or load a .txt/.vtt/.srt file) and run analysis.
export function VoiceIntake({ clientId }: { clientId: string }) {
  const [title, setTitle] = useState("");
  const [sourceType, setSourceType] = useState<string>("transcript");
  const [transcript, setTranscript] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  function loadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setTranscript(String(reader.result ?? ""));
    reader.readAsText(file);
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
  }

  async function run() {
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, title, sourceType, transcript }),
      });
      const data = await res.json();
      if (!res.ok || data.ok === false) return setErr(data.error ?? "Failed");
      setTitle("");
      setTranscript("");
      if (fileRef.current) fileRef.current.value = "";
      startTransition(() => router.refresh());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-neutral-200 p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (e.g. March strategy call)"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <select
          value={sourceType}
          onChange={(e) => setSourceType(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          {MEETING_SOURCES.map((s) => (
            <option key={s} value={s}>{MEETING_SOURCE_LABELS[s]}</option>
          ))}
        </select>
      </div>
      <input ref={fileRef} type="file" accept=".txt,.vtt,.srt,text/plain" onChange={loadFile} className="text-sm" />
      <textarea
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        rows={6}
        placeholder="Paste the transcript / call summary / Zoom export here, or load a file above."
        className="w-full resize-y rounded-md border border-neutral-300 px-3 py-2 text-sm"
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-400">Audio files are stored via Intake; paste their transcript here to analyze.</p>
        <button
          onClick={run}
          disabled={busy}
          className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {busy ? "Analyzing…" : "Analyze transcript"}
        </button>
      </div>
      {err && <p className="text-xs text-red-600">{err}</p>}
    </div>
  );
}
