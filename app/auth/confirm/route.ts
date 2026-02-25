import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { resolveRedirectPath, sanitizeRedirectPath } from "../../../lib/auth/redirect";
import {
  ensureProfileFromUserMetadata,
  getProfileById,
  isProfileComplete,
  resolveOnboardingPath,
} from "../../../lib/auth/profile";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

const allowedOtpTypes = new Set<EmailOtpType>([
  "signup",
  "recovery",
  "invite",
  "magiclink",
  "email_change",
  "email",
]);

function buildLoginErrorRedirect(request: NextRequest, nextPath: string | null) {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", "verify_failed");

  if (nextPath) {
    url.searchParams.set("next", nextPath);
  }

  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const otpTypeRaw = request.nextUrl.searchParams.get("type");
  const requestedNextPath = sanitizeRedirectPath(
    request.nextUrl.searchParams.get("next")
  );
  const redirectPath = resolveRedirectPath(requestedNextPath, "/saved");

  const supabase = await createSupabaseServerClient();
  let error: Error | null = null;

  if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code);
    error = result.error;
  } else if (
    tokenHash &&
    otpTypeRaw &&
    allowedOtpTypes.has(otpTypeRaw as EmailOtpType)
  ) {
    const result = await supabase.auth.verifyOtp({
      type: otpTypeRaw as EmailOtpType,
      token_hash: tokenHash,
    });
    error = result.error;
  } else {
    error = new Error("Missing verification parameters.");
  }

  if (error) {
    return buildLoginErrorRedirect(request, requestedNextPath);
  }

  if (otpTypeRaw === "recovery") {
    const recoveryUrl = new URL("/login", request.url);
    recoveryUrl.searchParams.set("mode", "recovery");

    if (requestedNextPath) {
      recoveryUrl.searchParams.set("next", requestedNextPath);
    }

    return NextResponse.redirect(recoveryUrl);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return buildLoginErrorRedirect(request, requestedNextPath);
  }

  try {
    await ensureProfileFromUserMetadata(supabase, user);
    const profile = await getProfileById(supabase, user.id);

    if (!isProfileComplete(profile)) {
      const onboardingPath = resolveOnboardingPath(requestedNextPath);
      return NextResponse.redirect(new URL(onboardingPath, request.url));
    }
  } catch {
    return buildLoginErrorRedirect(request, requestedNextPath);
  }

  return NextResponse.redirect(new URL(redirectPath, request.url));
}
