import { zodToJsonSchema } from "zod-to-json-schema";
import { callStructured, type Attachment } from "@/lib/claude/client";
import { vaultAnalysisSchema } from "@/lib/validation/vault";

// Structured-output schema (additionalProperties:false via .strict()).
const { $schema: _omit, ...analysisJsonSchema } = zodToJsonSchema(vaultAnalysisSchema, {
  target: "jsonSchema7",
}) as Record<string, unknown>;

// Document intelligence: send a vault file to Claude (vision/PDF) and extract a
// summary, the readable text, and suggested tags. Claude-only — no OCR service.

const SUPPORTED_IMAGE = ["image/png", "image/jpeg", "image/gif", "image/webp"];

export type DocAnalysis = { summary: string; extractedText: string; tags: string[] };

// Returns null when the mime type can't be analyzed (e.g. a raw .docx) — the
// caller leaves the doc searchable on title + manual tags only.
export async function analyzeDocumentBytes(
  bytes: Uint8Array,
  mimeType: string,
  fileName: string,
): Promise<DocAnalysis | null> {
  let attachment: Attachment | null = null;
  if (mimeType === "application/pdf") {
    attachment = { kind: "document", mediaType: "application/pdf", dataBase64: toBase64(bytes) };
  } else if (SUPPORTED_IMAGE.includes(mimeType)) {
    attachment = { kind: "image", mediaType: mimeType, dataBase64: toBase64(bytes) };
  }
  if (!attachment) return null;

  const system =
    "You analyze a client document for a content agency's Knowledge Vault. " +
    "Extract the readable text verbatim where possible, write a 1-3 sentence summary of " +
    "what the document is and what content it could inform, and suggest 3-8 lowercase tags. " +
    "Respond ONLY with JSON matching the schema.";
  const user = `Document file name: ${fileName}. Analyze the attached file.`;

  const { data } = await callStructured({
    tier: "mid",
    system,
    user,
    schema: analysisJsonSchema,
    attachments: [attachment],
    maxTokens: 8000,
  });
  const parsed = vaultAnalysisSchema.safeParse(data);
  if (!parsed.success) return null;
  return {
    summary: parsed.data.summary,
    extractedText: parsed.data.extractedText,
    tags: parsed.data.tags.map((t) => t.trim().toLowerCase()).filter(Boolean),
  };
}

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}
