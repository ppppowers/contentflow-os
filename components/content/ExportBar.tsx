"use client";

import { useState } from "react";

// Print-to-PDF + copy-all + download links. PDF = browser print (no server dep).
export function ExportBar({ projectId, markdown }: { projectId: string; markdown: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-3 print:hidden">
      <button
        onClick={() => window.print()}
        className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
      >
        Print / Save as PDF
      </button>
      <button
        onClick={async () => {
          await navigator.clipboard.writeText(markdown);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="rounded-md border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50"
      >
        {copied ? "Copied markdown" : "Copy all (markdown)"}
      </button>
      <a href={`/api/export?projectId=${projectId}&format=html`} className="text-sm text-blue-600 hover:underline">
        Download HTML
      </a>
      <a href={`/api/export?projectId=${projectId}&format=md`} className="text-sm text-blue-600 hover:underline">
        Download Markdown
      </a>
    </div>
  );
}
