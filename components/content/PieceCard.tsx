"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PieceEditor } from "./PieceEditor";
import { deleteImage } from "@/lib/actions/content";

const CHANNEL_LABELS: Record<string, string> = {
  newsletter: "Newsletter",
  blog: "Blog post",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  sms: "Text message (SMS)",
  website_announcement: "Website announcement",
};

type Image = { id: string; prompt: string; url: string | null };

export function PieceCard({
  projectId,
  piece,
  images,
  canHaveImages,
}: {
  projectId: string;
  piece: { id: string; channel: string; body: string; metadata: Record<string, unknown> };
  images: Image[];
  canHaveImages: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const meta = piece.metadata ?? {};
  const subjects = Array.isArray(meta.subjectLines) ? (meta.subjectLines as string[]) : [];

  if (editing) {
    return (
      <div className="space-y-2">
        <PieceEditor projectId={projectId} piece={piece} />
        <button onClick={() => setEditing(false)} className="text-xs text-neutral-500 hover:underline">
          Done editing
        </button>
      </div>
    );
  }

  return (
    <article className="space-y-3 rounded-xl border border-neutral-200 bg-white p-5">
      <header className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold">{CHANNEL_LABELS[piece.channel] ?? piece.channel}</h4>
        <div className="flex items-center gap-3">
          <CopyButton text={piece.body} />
          <button onClick={() => setEditing(true)} className="text-xs text-neutral-500 hover:underline">
            Edit
          </button>
        </div>
      </header>

      {subjects.length > 0 && (
        <div className="rounded-md bg-neutral-50 p-2 text-xs">
          <span className="font-medium text-neutral-600">Subject line options: </span>
          {subjects.join(" · ")}
        </div>
      )}
      {typeof meta.seoTitle === "string" && meta.seoTitle && (
        <div className="rounded-md bg-neutral-50 p-2 text-xs">
          <span className="font-medium text-neutral-600">SEO title: </span>
          {meta.seoTitle}
        </div>
      )}

      <p className={`whitespace-pre-wrap text-sm leading-relaxed text-neutral-800 ${piece.channel === "blog" ? "max-h-96 overflow-y-auto" : ""}`}>
        {piece.body}
      </p>

      {canHaveImages && <ImageStrip projectId={projectId} channel={piece.channel} images={images} />}
    </article>
  );
}

function ImageStrip({ projectId, channel, images }: { projectId: string; channel: string; images: Image[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [custom, setCustom] = useState(false);
  const [prompt, setPrompt] = useState(images[0]?.prompt ?? "");

  async function generate(withPrompt?: string) {
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, channel, prompt: withPrompt }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) setErr(data.error || (data.errors ?? []).join("; ") || "Image failed");
    setBusy(false);
    setCustom(false);
    router.refresh();
  }

  return (
    <div className="space-y-2 border-t border-neutral-100 pt-3">
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {images.map((img) => (
            <figure key={img.id} className="group relative overflow-hidden rounded-lg border border-neutral-200">
              {img.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img.url} alt={img.prompt} className="aspect-square w-full object-cover" />
              ) : (
                <div className="flex aspect-square items-center justify-center text-xs text-neutral-400">Unavailable</div>
              )}
              <figcaption className="flex items-center justify-between gap-2 bg-white px-2 py-1 text-xs">
                {img.url && (
                  <a href={img.url} download target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                    Download
                  </a>
                )}
                <form action={deleteImage.bind(null, projectId, img.id)}>
                  <button className="text-neutral-400 hover:text-red-600">Delete</button>
                </form>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {custom ? (
        <div className="space-y-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="Describe the image you want, e.g. 'A cozy coffee shop counter at sunrise, warm light, editorial photo style'"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
          />
          <div className="flex gap-2">
            <button
              disabled={busy || prompt.trim().length < 5}
              onClick={() => generate(prompt)}
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
            >
              {busy ? "Creating…" : "Create image"}
            </button>
            <button onClick={() => setCustom(false)} className="text-xs text-neutral-500 hover:underline">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 text-xs">
          <button
            disabled={busy}
            onClick={() => generate()}
            className="rounded-md border border-neutral-300 px-3 py-1.5 font-medium hover:bg-neutral-50 disabled:opacity-50"
          >
            {busy ? "Creating image…" : images.length ? "New image" : "Create image"}
          </button>
          <button onClick={() => setCustom(true)} className="text-neutral-500 hover:underline">
            Describe my own
          </button>
        </div>
      )}
      {err && <p className="text-xs text-red-600">{err}</p>}
    </div>
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
      className="rounded-md bg-neutral-900 px-3 py-1 text-xs font-medium text-white hover:bg-neutral-800"
    >
      {copied ? "Copied ✓" : "Copy"}
    </button>
  );
}
