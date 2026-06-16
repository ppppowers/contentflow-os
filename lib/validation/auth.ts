import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "At least 8 characters"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  agencyName: z.string().min(2, "Agency name required"),
  fullName: z.string().min(2, "Your name required"),
  email: z.string().email(),
  password: z.string().min(8, "At least 8 characters"),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const resetRequestSchema = z.object({
  email: z.string().email(),
});
export type ResetRequestInput = z.infer<typeof resetRequestSchema>;
