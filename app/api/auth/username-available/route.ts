import { NextResponse } from "next/server";
import { validateUsername } from "../../../../lib/auth/username";
import { isUsernameAvailable } from "../../../../lib/auth/profile";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username : "";

  const validation = validateUsername(username);

  if (!validation.ok) {
    return NextResponse.json(
      {
        available: false,
        normalizedUsername: validation.normalizedUsername,
        reason: validation.code,
        message: validation.message,
      },
      { status: 400 }
    );
  }

  try {
    const supabase = await createSupabaseServerClient();
    const available = await isUsernameAvailable(
      supabase,
      validation.normalizedUsername
    );

    return NextResponse.json({
      available,
      normalizedUsername: validation.normalizedUsername,
      reason: available ? null : "TAKEN",
      message: available ? null : "This username is already taken.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to check username.";

    return NextResponse.json(
      {
        error: {
          code: "CHECK_FAILED",
          message,
        },
      },
      { status: 500 }
    );
  }
}
