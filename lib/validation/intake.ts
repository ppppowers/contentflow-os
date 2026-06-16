import { z } from "zod";

export const INTAKE_TYPES = [
  "business_update",
  "promotion",
  "event",
  "testimonial",
  "new_service",
  "volunteer_story",
  "customer_story",
  "announcement",
  "project_complete",
  "team_update",
  "donor_story",
] as const;

export const INTAKE_TYPE_LABELS: Record<(typeof INTAKE_TYPES)[number], string> = {
  business_update: "Business update",
  promotion: "Promotion",
  event: "Event",
  testimonial: "Testimonial",
  new_service: "New service",
  volunteer_story: "Volunteer story",
  customer_story: "Customer story",
  announcement: "Announcement",
  project_complete: "Project complete",
  team_update: "Team update",
  donor_story: "Donor story",
};

export const intakeItemSchema = z.object({
  type: z.enum(INTAKE_TYPES),
  title: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
  body: z.string().trim().min(1, "Add some detail"),
});
export type IntakeItemInput = z.infer<typeof intakeItemSchema>;

export const intakeFileSchema = z.object({
  storage_path: z.string().min(1),
  file_name: z.string().min(1),
  mime_type: z.string().optional(),
  size_bytes: z.coerce.number().int().nonnegative().optional(),
  intake_item_id: z.string().uuid().optional(),
});
export type IntakeFileInput = z.infer<typeof intakeFileSchema>;

// First-of-month period string 'YYYY-MM-01'.
export function currentPeriod(): string {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${m}-01`;
}

export function isValidPeriod(p: string): boolean {
  return /^\d{4}-\d{2}-01$/.test(p);
}
