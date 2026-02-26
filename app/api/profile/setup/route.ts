import { NextResponse } from "next/server";
import { requireUser } from "../../../../lib/auth/api";
import { getProfileById, isUsernameAvailable } from "../../../../lib/auth/profile";
import { validateUsername } from "../../../../lib/auth/username";
import { trackMilestoneEvent } from "../../../../lib/data/analytics";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

export async function POST(request: Request) {
  const auth = await requireUser();

  if ("response" in auth) {
    return auth.response;
  }

  const body = await request.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username : "";
  const displayNameRaw =
    typeof body?.displayName === "string" ? body.displayName.trim() : "";

  const validation = validateUsername(username);

  if (!validation.ok) {
    return NextResponse.json(
      {
        error: {
          code: validation.code,
          message: validation.message,
        },
      },
      { status: 400 }
    );
  }

  if (!displayNameRaw) {
    return NextResponse.json(
      {
        error: {
          code: "DISPLAY_NAME_REQUIRED",
          message: "Display name is required.",
        },
      },
      { status: 400 }
    );
  }

  try {
    const supabase = await createSupabaseServerClient();
    const existingProfile = await getProfileById(supabase, auth.user.id);

    if (
      existingProfile?.handle &&
      existingProfile.handle !== validation.normalizedUsername
    ) {
      return NextResponse.json(
        {
          error: {
            code: "USERNAME_IMMUTABLE",
            message: "Username cannot be changed once set.",
          },
        },
        { status: 409 }
      );
    }

    const available = await isUsernameAvailable(
      supabase,
      validation.normalizedUsername,
      auth.user.id
    );

    if (!available) {
      return NextResponse.json(
        {
          error: {
            code: "TAKEN",
            message: "This username is already taken.",
          },
        },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: auth.user.id,
          handle: existingProfile?.handle ?? validation.normalizedUsername,
          display_name: displayNameRaw,
          avatar_url: existingProfile?.avatar_url ?? null,
          bio: existingProfile?.bio ?? null,
          interests: existingProfile?.interests ?? [],
        },
        {
          onConflict: "id",
        }
      )
      .select("id,handle,display_name,avatar_url,bio,interests")
      .single();

    if (error) {
      return NextResponse.json(
        {
          error: {
            code: "SAVE_FAILED",
            message: error.message,
          },
        },
        { status: 500 }
      );
    }

    try {
      await trackMilestoneEvent({
        userId: auth.user.id,
        eventName: "signup_completed",
        metadata: {
          source: "profile_setup",
        },
        client: supabase,
      });
    } catch {
      // Non-blocking for onboarding completion flow.
    }

    return NextResponse.json({
      data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to complete profile.";

    return NextResponse.json(
      {
        error: {
          code: "SAVE_FAILED",
          message,
        },
      },
      { status: 500 }
    );
  }
}
