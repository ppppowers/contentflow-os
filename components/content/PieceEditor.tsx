"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { Textarea, Input, SubmitButton, FormError } from "@/components/ui/form";
import { updatePiece, type ActionResult } from "@/lib/actions/content";

type Action = (prev: unknown, formData: FormData) => Promise<ActionResult>;

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
      className="text-xs text-blue-600 hover:underline"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function PieceEditor({
  projectId,
  piece,
}: {
  projectId: string;
  piece: { id: string; channel: string; body: string; metadata: Record<string, unknown> };
}) {
  const action: Action = updatePiece.bind(null, projectId, piece.id, piece.channel);
  const [state, formAction] = useFormState(action, undefined);
  const meta = piece.metadata ?? {};
  const join = (v: unknown) => (Array.isArray(v) ? v.join("\n") : "");

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-neutral-200 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{piece.channel}</p>
        <CopyButton text={piece.body} />
      </div>

      <Textarea label="Body" name="body" rows={piece.channel === "blog" ? 10 : 5} defaultValue={piece.body} />

      {piece.channel === "newsletter" && (
        <>
          <Textarea label="Subject lines (one per line)" name="subjectLines" defaultValue={join(meta.subjectLines)} />
          <Input label="Preview text" name="previewText" defaultValue={(meta.previewText as string) ?? ""} />
        </>
      )}

      {piece.channel === "blog" && (
        <div className="grid grid-cols-2 gap-3">
          <Input label="SEO title" name="seoTitle" defaultValue={(meta.seoTitle as string) ?? ""} />
          <Input label="Slug" name="slug" defaultValue={(meta.slug as string) ?? ""} />
          <Input label="Meta description" name="metaDescription" defaultValue={(meta.metaDescription as string) ?? ""} />
          <Textarea label="Keywords (one per line)" name="keywords" defaultValue={join(meta.keywords)} />
        </div>
      )}

      {state && "error" in state && <FormError message={state.error} />}
      {state && "ok" in state && <p className="text-sm text-green-600">Saved.</p>}
      <SubmitButton>Save piece</SubmitButton>
    </form>
  );
}
