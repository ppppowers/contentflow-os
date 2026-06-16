import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieToSet = { name: string; value: string; options: CookieOptions };

// RLS-scoped server client (anon key + user session cookies).
// Use this for ALL user-facing reads/writes. RLS enforces tenant isolation.
export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // called from a Server Component — middleware handles refresh
          }
        },
      },
    },
  );
}

// Service-role client. BYPASSES RLS. Server-only, trusted contexts only
// (onboarding: create agency + first owner profile). NEVER expose to client.
export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    { cookies: { getAll: () => [], setAll: () => {} } },
  );
}
