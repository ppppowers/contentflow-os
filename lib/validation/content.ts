import { z } from "zod";
import { lines } from "./client";

// Per-piece manual edits. Body always; metadata fields depend on channel.
export const pieceEditSchema = z.object({
  body: z.string().trim().min(1, "Body can't be empty"),
  // newsletter
  subjectLines: lines.optional(),
  previewText: z.string().trim().optional(),
  // blog
  seoTitle: z.string().trim().optional(),
  metaDescription: z.string().trim().optional(),
  slug: z.string().trim().optional(),
  keywords: lines.optional(),
});
export type PieceEditInput = z.infer<typeof pieceEditSchema>;

export const CONTENT_CHANNELS = [
  "newsletter",
  "blog",
  "facebook",
  "linkedin",
  "instagram",
  "sms",
  "website_announcement",
] as const;
