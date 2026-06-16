import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const STORY_CATEGORIES = ["customer", "volunteer", "donor", "employee", "project_success"] as const;
export type StoryCategory = (typeof STORY_CATEGORIES)[number];

export const STORY_CATEGORY_LABELS: Record<StoryCategory, string> = {
  customer: "Customer",
  volunteer: "Volunteer",
  donor: "Donor",
  employee: "Employee",
  project_success: "Project success",
};

// Story Mining Agent output.
const minedStory = z
  .object({
    category: z.enum(STORY_CATEGORIES),
    title: z.string(),
    summary: z.string(),
    detail: z.string(),
    tags: z.array(z.string()),
  })
  .strict();

export const minedStoriesSchema = z.object({ stories: z.array(minedStory) }).strict();
export type MinedStory = z.infer<typeof minedStory>;

export const minedStoriesJsonSchema = (() => {
  const { $schema, ...rest } = zodToJsonSchema(minedStoriesSchema, { target: "jsonSchema7" }) as Record<
    string,
    unknown
  >;
  return rest;
})();

// Manual add form.
export const storyFormSchema = z.object({
  category: z.enum(STORY_CATEGORIES),
  title: z.string().trim().min(2, "Title required"),
  summary: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
  detail: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
  tags: z
    .string()
    .optional()
    .transform((v) => (v ?? "").split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)),
});
export type StoryFormInput = z.infer<typeof storyFormSchema>;

// Pure: normalize a title for duplicate detection.
export function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
