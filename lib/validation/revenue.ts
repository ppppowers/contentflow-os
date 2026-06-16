import { z } from "zod";
import { lines } from "./client";

export const packageSchema = z.object({
  name: z.string().trim().min(2, "Name required"),
  monthly_price: z.coerce.number().min(0),
  deliverables: lines.optional(),
});
export type PackageInput = z.infer<typeof packageSchema>;

export const subscriptionSchema = z.object({
  client_id: z.string().uuid("Pick a client"),
  package_id: z.string().uuid().optional().or(z.literal("").transform(() => undefined)),
  monthly_amount: z.coerce.number().min(0),
  status: z.enum(["active", "past_due", "paused", "cancelled"]).default("active"),
});
export type SubscriptionInput = z.infer<typeof subscriptionSchema>;

export const revenueEventSchema = z.object({
  client_id: z.string().uuid("Pick a client"),
  subscription_id: z.string().uuid().optional().or(z.literal("").transform(() => undefined)),
  type: z.enum(["charge", "refund", "adjustment"]),
  amount: z.coerce.number(),
  payment_status: z.enum(["paid", "pending", "failed"]).default("paid"),
});
export type RevenueEventInput = z.infer<typeof revenueEventSchema>;
