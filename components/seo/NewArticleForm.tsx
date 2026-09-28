"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createSeoArticle } from "@/lib/actions/seo";

const field = "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900";

export function NewArticleForm({ clients }: { clients: { id: string; name: string }[] }) {
  const [state, action] = useFormState(createSeoArticle, undefined);
  return (
    <form action={action} className="space-y-3 rounded-xl border border-neutral-200 bg-white p-5">
      <p className="text-sm font-semibold">New SEO article</p>
      <div className="grid gap-3 sm:grid-cols-[200px_1fr_auto] sm:items-end">
        <label className="block space-y-1">
          <span className="text-xs font-medium text-neutral-700">Client</span>
          <select name="clientId" className={field} defaultValue={clients[0]?.id}>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-neutral-700">Search phrase to rank for</span>
          <input name="keyword" className={field} placeholder="e.g. volunteer management software for small nonprofits" />
        </label>
        <Submit />
      </div>
      {state && "error" in state && <p className="text-sm text-red-600">{state.error}</p>}
      {clients.length === 0 && <p className="text-xs text-neutral-500">Add a client first (Clients → New).</p>}
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
      {pending ? "Starting…" : "Research & write →"}
    </button>
  );
}
