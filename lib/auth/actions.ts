"use server";

import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { loginSchema, signupSchema, resetRequestSchema } from "@/lib/validation/auth";

export type ActionResult = { error: string } | { ok: true };

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40);
}

const UNAVAILABLE_MESSAGE =
  "Can't reach the database right now. If your Supabase project is paused, restore it in the Supabase dashboard and try again.";

// Sign in with email/password. Redirects on success.
export async function signInAction(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Invalid email or password format." };

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    // status 0 = network failure (e.g. Supabase project paused), not bad credentials.
    if (!error.status || error.status >= 500) return { error: UNAVAILABLE_MESSAGE };
    return { error: "Incorrect email or password." };
  }
  redirect("/dashboard");
}

// Self-serve signup: creates a NEW agency + an owner profile for the new user.
// Profile insert uses the service role (RLS has no INSERT policy for profiles by design).
export async function signUpAction(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = signupSchema.safeParse({
    agencyName: formData.get("agencyName"),
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const { agencyName, fullName, email, password } = parsed.data;

  const supabase = createClient();
  const { data: signUp, error: signUpErr } = await supabase.auth.signUp({ email, password });
  if (signUpErr || !signUp.user) return { error: signUpErr?.message ?? "Sign up failed." };

  const userId = signUp.user.id;
  const admin = createServiceClient();

  // Unique slug
  let slug = slugify(agencyName) || "agency";
  const { data: existing } = await admin.from("agencies").select("id").eq("slug", slug).maybeSingle();
  if (existing) slug = `${slug}-${userId.slice(0, 6)}`;

  const { data: agency, error: agencyErr } = await admin
    .from("agencies")
    .insert({ name: agencyName, slug })
    .select("id")
    .single();
  if (agencyErr || !agency) {
    console.error("[signup] agency insert failed:", agencyErr);
    return { error: `Could not create agency: ${agencyErr?.message ?? "unknown error"}` };
  }

  const { error: profileErr } = await admin.from("profiles").insert({
    id: userId,
    agency_id: agency.id,
    role: "owner",
    full_name: fullName,
    email,
  });
  if (profileErr) return { error: "Could not create owner profile." };

  // Email confirmation may be required depending on project settings.
  redirect("/dashboard");
}

export async function signOutAction(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordResetAction(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = resetRequestSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: "Enter a valid email." };

  const supabase = createClient();
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${site}/reset-password`,
  });
  // Always report success (don't leak which emails exist).
  return { ok: true };
}
