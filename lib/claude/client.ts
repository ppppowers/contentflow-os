import Anthropic from "@anthropic-ai/sdk";

// Server-only Claude wrapper. NEVER import from client components.
// Model tiers: strong = writing/strategy/judgment, mid/cheap = transforms/packaging.

export type ModelTier = "strong" | "mid" | "cheap";

const MODELS: Record<ModelTier, string> = {
  strong: "claude-opus-4-8",
  mid: "claude-sonnet-4-6",
  cheap: "claude-haiku-4-5",
};

// USD per 1M tokens [input, output].
const PRICING: Record<string, [number, number]> = {
  "claude-opus-4-8": [5, 25],
  "claude-sonnet-4-6": [3, 15],
  "claude-haiku-4-5": [1, 5],
};

export type ClaudeUsage = {
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
};

export type StructuredResult<T> = { data: T; usage: ClaudeUsage };

function client() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY missing");
  return new Anthropic();
}

function costOf(model: string, input: number, output: number): number {
  const [pin, pout] = PRICING[model] ?? [0, 0];
  return (input * pin + output * pout) / 1_000_000;
}

// Optional image/PDF attachments for vision tasks (e.g. Knowledge Vault intelligence).
export type Attachment = {
  kind: "image" | "document";
  mediaType: string; // e.g. image/png, application/pdf
  dataBase64: string;
};

// Anthropic structured outputs reject numeric range/format keywords that
// zod-to-json-schema emits (e.g. `minimum`/`maximum` on integers). Strip the
// unsupported keywords recursively — Zod still enforces them after parse.
const UNSUPPORTED_SCHEMA_KEYS = new Set([
  "minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum", "multipleOf",
  "minLength", "maxLength", "pattern", "format", "minItems", "maxItems",
  "uniqueItems", "default",
]);

export function sanitizeSchema(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(sanitizeSchema);
  if (node && typeof node === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      if (UNSUPPORTED_SCHEMA_KEYS.has(k)) continue;
      out[k] = sanitizeSchema(v);
    }
    return out;
  }
  return node;
}

// Calls Claude with a forced JSON-schema response. Caller validates with Zod.
export async function callStructured<T = unknown>(args: {
  tier: ModelTier;
  system: string;
  user: string;
  schema: Record<string, unknown>;
  maxTokens?: number;
  attachments?: Attachment[];
}): Promise<StructuredResult<T>> {
  const model = MODELS[args.tier];

  // When attachments are present, build a content-block array (files first, then text).
  const content =
    args.attachments && args.attachments.length > 0
      ? [
          ...args.attachments.map((a) => ({
            type: a.kind,
            source: { type: "base64", media_type: a.mediaType, data: a.dataBase64 },
          })),
          { type: "text", text: args.user },
        ]
      : args.user;

  const res = await client().messages.create({
    model,
    max_tokens: args.maxTokens ?? 16000,
    system: args.system,
    messages: [{ role: "user", content }],
    // Constrain output to the JSON schema (structured outputs). Sanitized of
    // keywords Anthropic's structured-output validator doesn't accept.
    output_config: { format: { type: "json_schema", schema: sanitizeSchema(args.schema) } },
  } as never);

  const text =
    (res.content.find((b) => b.type === "text") as { text?: string } | undefined)?.text ?? "";
  let data: T;
  try {
    data = JSON.parse(text) as T;
  } catch {
    throw new Error("Claude returned non-JSON output");
  }

  const inputTokens = res.usage?.input_tokens ?? 0;
  const outputTokens = res.usage?.output_tokens ?? 0;
  return {
    data,
    usage: { model, inputTokens, outputTokens, costUsd: costOf(model, inputTokens, outputTokens) },
  };
}
