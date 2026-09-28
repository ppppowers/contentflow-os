"use client";

import { useFormState, useFormStatus } from "react-dom";
import { saveOutline } from "@/lib/actions/seo";

export function OutlineForm({ articleId, text }: { articleId: string; text: string }) {
  const [state, action] = useFormState(saveOutline.bind(null, articleId), undefined);
  return (
    <form action={action} className="space-y-2">
      <textarea
        name="outline"
        defaultValue={text}
        rows={Math.min(18, Math.max(6, text.split("\n").length + 1))}
        className="w-full rounded-md border border-neutral-300 px-3 py-2 font-mono text-xs outline-none focus:border-neutral-900"
      />
      <p className="text-xs text-neutral-400">One section per line: “## Heading — notes”. Use ### for sub-sections.</p>
      <div className="flex items-center gap-3">
        <Save />
        {state && "error" in state && <span className="text-xs text-red-600">{state.error}</span>}
        {state && "ok" in state && <span className="text-xs text-green-700">Saved</span>}
      </div>
    </form>
  );
}

function Save() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50 disabled:opacity-50">
      {pending ? "Saving…" : "Save outline"}
    </button>
  );
}
