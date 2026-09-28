"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { saveArticleEdits } from "@/lib/actions/seo";

const field = "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900";

export function ArticleEditor({
  articleId,
  title,
  metaDescription,
  slug,
  bodyMd,
  previewHtml,
}: {
  articleId: string;
  title: string;
  metaDescription: string;
  slug: string;
  bodyMd: string;
  previewHtml: string;
}) {
  const [editing, setEditing] = useState(false);
  const [state, action] = useFormState(saveArticleEdits.bind(null, articleId), undefined);
  const [meta, setMeta] = useState(metaDescription);
  const [t, setT] = useState(title);

  if (!editing) {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-neutral-200 p-3">
          <p className="text-xs text-neutral-400">How it may look in Google</p>
          <p className="text-base text-blue-800">{title}</p>
          <p className="text-xs text-green-800">…/{slug}</p>
          <p className="text-sm text-neutral-600">{metaDescription}</p>
        </div>
        <article
          className="prose-sm max-h-[32rem] space-y-3 overflow-y-auto rounded-lg border border-neutral-200 p-5 text-sm leading-relaxed [&_a]:text-blue-700 [&_a]:underline [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:font-semibold [&_li]:ml-5 [&_li]:list-disc"
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
        <div className="flex gap-3">
          <button onClick={() => setEditing(true)} className="text-sm text-neutral-600 hover:underline">
            Edit text
          </button>
          <CopyButton text={bodyMd} />
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <label className="block space-y-1">
        <span className="text-xs font-medium text-neutral-700">Title ({t.length}/60)</span>
        <input name="title" value={t} onChange={(e) => setT(e.target.value)} className={field} />
      </label>
      <label className="block space-y-1">
        <span className="text-xs font-medium text-neutral-700">Meta description ({meta.length}/155)</span>
        <textarea name="metaDescription" value={meta} onChange={(e) => setMeta(e.target.value)} rows={2} className={field} />
      </label>
      <label className="block space-y-1">
        <span className="text-xs font-medium text-neutral-700">URL slug</span>
        <input name="slug" defaultValue={slug} className={field} />
      </label>
      <label className="block space-y-1">
        <span className="text-xs font-medium text-neutral-700">Article (Markdown)</span>
        <textarea name="bodyMd" defaultValue={bodyMd} rows={22} className={`${field} font-mono text-xs`} />
      </label>
      <div className="flex items-center gap-3">
        <Save />
        <button type="button" onClick={() => setEditing(false)} className="text-sm text-neutral-500 hover:underline">
          Close
        </button>
        {state && "error" in state && <span className="text-xs text-red-600">{state.error}</span>}
        {state && "ok" in state && <span className="text-xs text-green-700">Saved — score updated</span>}
      </div>
    </form>
  );
}

function Save() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50">
      {pending ? "Saving…" : "Save changes"}
    </button>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="text-sm text-neutral-600 hover:underline"
    >
      {copied ? "Copied ✓" : "Copy Markdown"}
    </button>
  );
}
