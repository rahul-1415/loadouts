import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getProfileById, isProfileComplete, type ProfileIdentity } from "./profile";
import { createSupabaseServerClient } from "../supabase/server";

export function unauthorizedResponse() {
  return NextResponse.json(
    {
      error: {
        code: "UNAUTHORIZED",
        message: "Sign in required",
      },
    },
    { status: 401 }
  );
}

export function forbiddenResponse() {
  return NextResponse.json(
    {
      error: {
        code: "FORBIDDEN",
        message: "Not allowed",
      },
    },
    { status: 403 }
  );
}

export function incompleteProfileResponse() {
  return NextResponse.json(
    {
      error: {
        code: "PROFILE_INCOMPLETE",
        message: "Complete profile setup",
      },
    },
    { status: 409 }
  );
}

export async function requireUser(): Promise<{
  user: User;
} | {
  response: NextResponse;
}> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { response: unauthorizedResponse() };
  }

  return { user };
}

export async function requireCompleteUser(): Promise<{
  user: User;
  profile: ProfileIdentity;
} | {
  response: NextResponse;
}> {
  const auth = await requireUser();

  if ("response" in auth) {
    return auth;
  }

  const supabase = await createSupabaseServerClient();
  const profile = await getProfileById(supabase, auth.user.id);

  if (!profile || !isProfileComplete(profile)) {
    return { response: incompleteProfileResponse() };
  }

  return {
    user: auth.user,
    profile,
  };
}

export function assertOwner(resourceOwnerId: string | null, userId: string) {
  if (!resourceOwnerId) {
    return null;
  }

  if (resourceOwnerId !== userId) {
    return forbiddenResponse();
  }

  return null;
}
