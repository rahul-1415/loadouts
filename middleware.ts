import { NextResponse, type NextRequest } from "next/server";
import { resolveRedirectPath } from "./lib/auth/redirect";
import { resolveOnboardingPath } from "./lib/auth/profile";
import { updateSession } from "./lib/supabase/middleware";

const protectedPaths = new Set([
  "/saved",
  "/collections/new",
  "/categories/new",
  "/loadouts/new",
  "/profile",
]);

const authPaths = new Set(["/login", "/signup"]);
const onboardingPath = "/onboarding/profile";

function normalizePath(pathname: string) {
  if (pathname !== "/" && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

export async function middleware(request: NextRequest) {
  const pathname = normalizePath(request.nextUrl.pathname);
  const { response, user, profileComplete } = await updateSession(request);

  if (pathname.startsWith("/api")) {
    return response;
  }

  if (
    user &&
    !profileComplete &&
    pathname !== onboardingPath &&
    !pathname.startsWith("/auth/callback") &&
    !pathname.startsWith("/auth/confirm")
  ) {
    const redirectTo = resolveOnboardingPath(
      `${request.nextUrl.pathname}${request.nextUrl.search}`
    );
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  if (protectedPaths.has(pathname) && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(
      "next",
      `${request.nextUrl.pathname}${request.nextUrl.search}`
    );

    return NextResponse.redirect(loginUrl);
  }

  if (authPaths.has(pathname) && user) {
    if (!profileComplete) {
      const requestedNext = request.nextUrl.searchParams.get("next");
      const redirectTo = resolveOnboardingPath(requestedNext);
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }

    const redirectPath = resolveRedirectPath(
      request.nextUrl.searchParams.get("next"),
      "/saved"
    );

    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
