import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

// Refreshes the auth session on every request and returns the user.
// Called from root middleware.ts.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: getUser() validates the JWT with the auth server (do not trust getSession alone).
  // Bounded: when Supabase is unreachable (e.g. a paused project) auth-js retries a
  // token refresh for ~30s, which exceeds Vercel's middleware limit and leaves a
  // white screen. Give up after AUTH_TIMEOUT_MS and treat the request as signed out.
  const result = await Promise.race([
    supabase.auth.getUser().then(({ data }) => ({ user: data.user, timedOut: false })),
    new Promise<{ user: null; timedOut: true }>((resolve) =>
      setTimeout(() => resolve({ user: null, timedOut: true }), AUTH_TIMEOUT_MS),
    ),
  ]);

  return { response, user: result.user, authUnavailable: result.timedOut };
}

const AUTH_TIMEOUT_MS = 5000;
