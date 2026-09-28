import { z } from "zod";

const opt = z.string().trim().optional().or(z.literal("").transform(() => undefined));

export const newSeoArticleSchema = z.object({
  clientId: z.string().uuid("Pick a client"),
  keyword: z.string().trim().min(3, "Enter the search phrase you want to rank for").max(120),
});

export const articleEditSchema = z.object({
  title: z.string().trim().min(5, "Title is too short").max(120),
  metaDescription: z.string().trim().max(300),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug: lowercase letters, numbers and hyphens only"),
  bodyMd: z.string().trim().min(50, "Article body is too short"),
});

// "## Heading — notes" per line (### for sub-sections).
export function parseOutline(text: string) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const level = l.startsWith("###") ? 3 : 2;
      const rest = l.replace(/^#{1,6}\s*/, "");
      const [heading, ...notes] = rest.split(/\s+[—-]\s+/);
      return { heading: heading.trim(), level, notes: notes.join(" — ").trim() };
    })
    .filter((o) => o.heading.length > 0);
}

export const siteConnectionSchema = z.object({
  siteUrl: z.string().trim().url("Site URL must start with https://"),
  repo: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/, "Repo must look like owner/name")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  branch: z.string().trim().min(1).default("main"),
  contentDir: opt,
  urlPrefix: z.string().trim().regex(/^\/[a-z0-9/_-]*$/i, "URL prefix must start with /").default("/resources"),
  sitemapPath: opt,
  brandTerms: opt,
});

export const promptSchema = z.object({
  prompt: z.string().trim().min(8, "Write the question the way a customer would ask it").max(300),
});
