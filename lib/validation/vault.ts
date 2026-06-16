import { z } from "zod";

export const VAULT_DOC_TYPES = [
  "pdf", "flyer", "logo", "image", "brochure", "brand_guide", "sop", "meeting_notes", "other",
] as const;

export type VaultDocType = (typeof VAULT_DOC_TYPES)[number];

export const VAULT_DOC_TYPE_LABELS: Record<VaultDocType, string> = {
  pdf: "PDF",
  flyer: "Flyer",
  logo: "Logo",
  image: "Image",
  brochure: "Brochure",
  brand_guide: "Brand Guide",
  sop: "SOP",
  meeting_notes: "Meeting Notes",
  other: "Other",
};

// Comma-separated tag input → cleaned string[].
export const tagsField = z
  .string()
  .optional()
  .transform((v) =>
    (v ?? "")
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean),
  );

// Recorded after a successful direct-to-storage upload.
export const recordVaultDocSchema = z.object({
  title: z.string().trim().min(2, "Title required"),
  doc_type: z.enum(VAULT_DOC_TYPES),
  tags: z.array(z.string()),
  storage_path: z.string().min(1),
  file_name: z.string().min(1),
  mime_type: z.string().optional(),
  size_bytes: z.number().int().nonnegative().optional(),
});
export type RecordVaultDocInput = z.infer<typeof recordVaultDocSchema>;

// Claude document-intelligence output.
export const vaultAnalysisSchema = z
  .object({
    summary: z.string(),
    extractedText: z.string(),
    tags: z.array(z.string()),
  })
  .strict();
