import { z } from "zod";

const optionalText = z.string().trim().optional().or(z.literal("").transform(() => undefined));

// One-page "Create content" form. clientId is an existing client's id or "new".
export const quickCreateSchema = z
  .object({
    clientId: z.string().min(1, "Pick who this content is for"),
    newClientName: optionalText,
    newClientWebsite: z
      .string()
      .trim()
      .url("Website must be a full URL, like https://example.com")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    newClientIndustry: optionalText,
    voice: optionalText,
    audience: optionalText,
    brief: z.string().trim().min(15, "Tell us a bit more about what this content should cover (a sentence or two)"),
    images: z
      .union([z.literal("on"), z.literal("")])
      .optional()
      .transform((v) => v === "on"),
  })
  .refine((v) => v.clientId !== "new" || (v.newClientName?.length ?? 0) >= 2, {
    message: "Give the new client (or your brand) a name",
    path: ["newClientName"],
  });
export type QuickCreateInput = z.infer<typeof quickCreateSchema>;

// "Week of Sep 28" — the Monday of the given date's week. On weekends people are
// planning ahead, so Saturday/Sunday label the coming week.
export function weekLabel(d = new Date()): string {
  const monday = new Date(d);
  const day = d.getDay(); // 0 = Sunday
  const offset = day === 0 ? 1 : day === 6 ? 2 : -(day - 1);
  monday.setDate(d.getDate() + offset);
  return `Week of ${monday.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}
