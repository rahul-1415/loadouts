import { NextResponse } from "next/server";
import { requireCompleteUser } from "../../../lib/auth/api";
import { getProfileByHandle } from "../../../lib/auth/profile";
import { normalizeUsername } from "../../../lib/auth/username";
import { trackMilestoneEvent } from "../../../lib/data/analytics";
import { createNotification } from "../../../lib/data/notifications";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

export async function POST(request: Request) {
  const auth = await requireCompleteUser();

  if ("response" in auth) {
    return auth.response;
  }

  const body = await request.json().catch(() => null);
  const targetHandle =
    typeof body?.targetHandle === "string" ? body.targetHandle : "";

  if (!targetHandle.trim()) {
    return NextResponse.json(
      {
        error: {
          code: "TARGET_REQUIRED",
          message: "Target handle is required.",
        },
      },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const targetProfile = await getProfileByHandle(
    supabase,
    normalizeUsername(targetHandle)
  );

  if (!targetProfile) {
    return NextResponse.json(
      {
        error: {
          code: "NOT_FOUND",
          message: "Profile not found.",
        },
      },
      { status: 404 }
    );
  }

  if (targetProfile.id === auth.user.id) {
    return NextResponse.json(
      {
        error: {
          code: "SELF_FOLLOW",
          message: "You cannot follow yourself.",
        },
      },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("follows").insert({
    follower_id: auth.user.id,
    following_id: targetProfile.id,
  });

  const createdFollow = !error;

  if (error && error.code !== "23505") {
    return NextResponse.json(
      {
        error: {
          code: "FOLLOW_FAILED",
          message: error.message,
        },
      },
      { status: 500 }
    );
  }

  if (createdFollow) {
    try {
      await trackMilestoneEvent({
        userId: auth.user.id,
        eventName: "first_follow",
        metadata: {
          targetUserId: targetProfile.id,
          targetHandle: targetProfile.handle,
        },
        client: supabase,
      });
    } catch {
      // Non-blocking for follow action.
    }

    try {
      await createNotification({
        recipientId: targetProfile.id,
        actorId: auth.user.id,
        type: "follow",
        entityType: "profile",
        entityId: auth.user.id,
        metadata: {
          targetHandle: targetProfile.handle,
        },
      });
    } catch {
      // Non-blocking for follow action.
    }
  }

  return NextResponse.json({
    data: {
      following: true,
      targetHandle: targetProfile.handle,
    },
  });
}
