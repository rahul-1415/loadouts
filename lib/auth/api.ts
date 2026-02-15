import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
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

export function assertOwner(resourceOwnerId: string | null, userId: string) {
  if (!resourceOwnerId) {
    return null;
  }

  if (resourceOwnerId !== userId) {
    return forbiddenResponse();
  }

  return null;
}
