import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { type Role, isStaff, isAdmin } from "./roles";

export type SessionContext = {
  userId: string;
  email: string;
  agencyId: string;
  role: Role;
};

// Resolve the current authenticated user + their profile (tenant + role).
// Returns null if unauthenticated or profile missing.
export async function getSessionContext(): Promise<SessionContext | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id, role, email")
    .eq("id", user.id)
    .single();

  if (!profile) return null;
  return {
    userId: user.id,
    email: profile.email ?? user.email ?? "",
    agencyId: profile.agency_id,
    role: profile.role as Role,
  };
}

// Server-side guards for layouts / route handlers. Redirect on failure.
export async function requireSession(): Promise<SessionContext> {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  return ctx;
}

export async function requireStaff(): Promise<SessionContext> {
  const ctx = await requireSession();
  if (!isStaff(ctx.role)) redirect("/review"); // client portal
  return ctx;
}

export async function requireAdmin(): Promise<SessionContext> {
  const ctx = await requireSession();
  if (!isAdmin(ctx.role)) redirect("/dashboard");
  return ctx;
}

export async function requireClient(): Promise<SessionContext> {
  const ctx = await requireSession();
  if (ctx.role !== "client") redirect("/dashboard");
  return ctx;
}
