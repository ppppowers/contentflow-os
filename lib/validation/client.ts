import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .url("Must be a valid URL")
  .optional()
  .or(z.literal("").transform(() => undefined));

export const clientSchema = z.object({
  name: z.string().trim().min(2, "Name required"),
  website_url: optionalUrl,
  industry: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
  status: z.enum(["active", "paused", "churned"]).default("active"),
  health_score: z.coerce.number().int().min(0).max(100).default(100),
});
export type ClientInput = z.infer<typeof clientSchema>;

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Name required"),
  email: z.string().trim().email().optional().or(z.literal("").transform(() => undefined)),
  phone: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
  title: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
  is_primary: z.coerce.boolean().default(false),
});
export type ContactInput = z.infer<typeof contactSchema>;

export const noteSchema = z.object({
  body: z.string().trim().min(1, "Note can't be empty"),
  pinned: z.coerce.boolean().default(false),
});
export type NoteInput = z.infer<typeof noteSchema>;

// Multiline textarea → string[] (one item per line, trimmed, empties dropped).
export const lines = z
  .string()
  .optional()
  .transform((v) =>
    (v ?? "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
  );

export const brandProfileSchema = z.object({
  voice_summary: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
  tone_descriptors: lines,
  audience: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
  products_services: lines, // stored as jsonb array of strings
  sample_copy: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
  banned_phrases: lines,
  required_disclaimers: lines,
  reading_level: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
});
export type BrandProfileInput = z.infer<typeof brandProfileSchema>;
