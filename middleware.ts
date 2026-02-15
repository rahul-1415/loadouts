import { NextResponse, type NextRequest } from "next/server";
import { resolveRedirectPath } from "./lib/auth/redirect";
import { updateSession } from "./lib/supabase/middleware";

const protectedPaths = new Set([
  "/saved",
  "/collections/new",
  "/categories/new",
  "/loadouts/new",
  "/profile",
]);

const authPaths = new Set(["/login", "/signup"]);

function normalizePath(pathname: string) {
  if (pathname !== "/" && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

export async function middleware(request: NextRequest) {
  const pathname = normalizePath(request.nextUrl.pathname);
  const { response, user } = await updateSession(request);

  if (protectedPaths.has(pathname) && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(
      "next",
      `${request.nextUrl.pathname}${request.nextUrl.search}`
    );

    return NextResponse.redirect(loginUrl);
  }

  if (authPaths.has(pathname) && user) {
    const redirectPath = resolveRedirectPath(
      request.nextUrl.searchParams.get("next"),
      "/saved"
    );

    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/saved",
    "/collections/new",
    "/categories/new",
    "/loadouts/new",
    "/profile",
    "/login",
    "/signup",
  ],
};
