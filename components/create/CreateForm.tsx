"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { quickCreateProject } from "@/lib/actions/create";

type ClientOption = { id: string; name: string; hasBrand: boolean };

const field =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900";

export function CreateForm({ clients, defaultClientId }: { clients: ClientOption[]; defaultClientId?: string }) {
  const [state, formAction] = useFormState(quickCreateProject, undefined);
  const initial =
    defaultClientId && clients.some((c) => c.id === defaultClientId)
      ? defaultClientId
      : clients[0]?.id ?? "new";
  const [clientId, setClientId] = useState(initial);
  const isNew = clientId === "new";
  const needsBrand = isNew || !clients.find((c) => c.id === clientId)?.hasBrand;

  return (
    <form action={formAction} className="space-y-6">
      <Step n={1} title="Who is it for?">
        <select name="clientId" value={clientId} onChange={(e) => setClientId(e.target.value)} className={field}>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
          <option value="new">+ New client or my own brand</option>
        </select>

        {isNew && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1 sm:col-span-2">
              <span className="text-xs font-medium text-neutral-700">Name</span>
              <input name="newClientName" className={field} placeholder="e.g. ContentFlow OS" />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-neutral-700">Website (optional)</span>
              <input name="newClientWebsite" className={field} placeholder="https://…" />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-neutral-700">Industry (optional)</span>
              <input name="newClientIndustry" className={field} placeholder="e.g. Marketing agency" />
            </label>
          </div>
        )}

        {needsBrand && (
          <div className="space-y-3 rounded-lg bg-neutral-50 p-3">
            <p className="text-xs text-neutral-500">
              Optional, but it makes the writing sound like them. You can add more detail later under the
              client&apos;s Brand &amp; voice tab.
            </p>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-neutral-700">How should it sound?</span>
              <input name="voice" className={field} placeholder="e.g. Friendly, direct, a bit funny. No jargon." />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-neutral-700">Who is it for?</span>
              <input name="audience" className={field} placeholder="e.g. Small business owners in Ohio" />
            </label>
          </div>
        )}
      </Step>

      <Step n={2} title="What should this week's content be about?">
        <textarea
          name="brief"
          rows={6}
          className={field}
          placeholder={
            "Anything goes — news, a promotion, an event, a customer story, a tip you want to share.\n\ne.g. We're launching free content audits in October. Theme: why AI content sounds generic and how to fix it. Mention the Oct 15 webinar."
          }
        />
      </Step>

      <Step n={3} title="Extras">
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="images" defaultChecked className="mt-0.5" />
          <span>
            Create images for the social posts and newsletter
            <span className="block text-xs text-neutral-400">
              Made with OpenAI after the writing is done (a few cents per image). You can add or redo images later.
            </span>
          </span>
        </label>
      </Step>

      {state && "error" in state && <p className="text-sm text-red-600">{state.error}</p>}
      <Submit />
    </form>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl border border-neutral-200 bg-white p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-xs text-white">
          {n}
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-neutral-900 px-4 py-3 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
    >
      {pending ? "Setting up…" : "Create content →"}
    </button>
  );
}
