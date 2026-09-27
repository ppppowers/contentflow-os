// Server-only OpenAI image generation. NEVER import from client components.
// Model is configurable so a newer OpenAI image model can be swapped in via env.

export type ImageSize = "1024x1024" | "1536x1024" | "1024x1536";

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
    | { data?: { b64_json?: string }[]; error?: { message?: string } }
    | null;
  if (!res.ok) {
    throw new Error(`OpenAI image error (${res.status}): ${json?.error?.message ?? res.statusText}`);
  }
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI returned no image.");
  return { png: Buffer.from(b64, "base64"), model, size };
}
