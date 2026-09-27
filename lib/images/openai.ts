// Server-only OpenAI image generation. NEVER import from client components.
// Model is configurable so a newer OpenAI image model can be swapped in via env.

import type { ImageSize } from "./channels";

export type { ImageSize };

// Carries OpenAI's error code so callers can tell "out of credits" from other failures.
export class OpenAIImageError extends Error {
  constructor(message: string, readonly status: number, readonly code: string | null) {
    super(message);
  }
  get isBilling(): boolean {
    return (
      ["insufficient_quota", "billing_hard_limit_reached", "billing_not_active"].includes(this.code ?? "") ||
      /billing|quota|credit/i.test(this.message)
    );
  }
}

export type GeneratedImage = { png: Buffer; model: string; size: ImageSize };

const DEFAULT_MODEL = "gpt-image-2";

export function imagesConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

export async function generateImage(prompt: string, size: ImageSize): Promise<GeneratedImage> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY missing — add it in Vercel → Settings → Environment Variables.");
  const model = process.env.OPENAI_IMAGE_MODEL || DEFAULT_MODEL;

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt, size, quality: "medium", n: 1 }),
  });

  const json = (await res.json().catch(() => null)) as
    | { data?: { b64_json?: string }[]; error?: { message?: string; code?: string | null } }
    | null;
  if (!res.ok) {
    throw new OpenAIImageError(
      `OpenAI image error (${res.status}): ${json?.error?.message ?? res.statusText}`,
      res.status,
      json?.error?.code ?? null,
    );
  }
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI returned no image.");
  return { png: Buffer.from(b64, "base64"), model, size };
}
