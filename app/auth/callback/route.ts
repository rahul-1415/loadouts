import { NextResponse, type NextRequest } from "next/server";
import { resolveRedirectPath, sanitizeRedirectPath } from "../../../lib/auth/redirect";
import {
  ensureProfileFromUserMetadata,
  getProfileById,
  isProfileComplete,
  resolveOnboardingPath,
} from "../../../lib/auth/profile";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

function buildLoginErrorRedirect(
  request: NextRequest,
  errorCode: string,
  nextPath: string | null
) {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", errorCode);

  if (nextPath) {
    url.searchParams.set("next", nextPath);
  }

  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const requestedNextPath = sanitizeRedirectPath(
    request.nextUrl.searchParams.get("next")
  );
  const redirectPath = resolveRedirectPath(requestedNextPath, "/saved");

  if (!code) {
    return buildLoginErrorRedirect(request, "oauth_failed", requestedNextPath);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return buildLoginErrorRedirect(request, "oauth_failed", requestedNextPath);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return buildLoginErrorRedirect(request, "oauth_failed", requestedNextPath);
  }

  try {
    await ensureProfileFromUserMetadata(supabase, user);
    const profile = await getProfileById(supabase, user.id);

    if (!isProfileComplete(profile)) {
      const onboardingPath = resolveOnboardingPath(requestedNextPath);
      return NextResponse.redirect(new URL(onboardingPath, request.url));
    }
  } catch {
    return buildLoginErrorRedirect(request, "oauth_failed", requestedNextPath);
  }

  return NextResponse.redirect(new URL(redirectPath, request.url));
}
