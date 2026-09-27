import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_PATHS = ["/login", "/signup", "/reset-password", "/auth"];

export async function middleware(request: NextRequest) {
  const { response, user, authUnavailable } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  // Password recovery lands here WITH a session — must not be bounced away.
  const isRecovery = pathname.startsWith("/reset-password");

  // Unauthenticated → bounce to login (except public auth routes)
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    if (authUnavailable) url.searchParams.set("error", "unavailable");
    return NextResponse.redirect(url);
  }

  // Authenticated user hitting an auth page → send to app root.
  // Exception: /reset-password (recovery session needs to set a new password).
  if (user && isPublic && !isRecovery) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Run on everything except static assets
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
