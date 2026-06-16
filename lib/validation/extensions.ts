import { z } from "zod";

const optionalText = z.string().trim().optional().or(z.literal("").transform(() => undefined));

export const brandingSchema = z.object({
  brand_name: optionalText,
  logo_url: z.string().trim().url("Must be a URL").optional().or(z.literal("").transform(() => undefined)),
  primary_color: optionalText,
  custom_domain: optionalText,
  white_label: z.coerce.boolean().default(false),
});
export type BrandingInput = z.infer<typeof brandingSchema>;
