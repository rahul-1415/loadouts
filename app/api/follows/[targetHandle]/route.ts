import { NextResponse } from "next/server";
import { requireCompleteUser } from "../../../../lib/auth/api";
import { getProfileByHandle } from "../../../../lib/auth/profile";
import { normalizeUsername } from "../../../../lib/auth/username";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

interface RouteContext {
  params: {
    targetHandle: string;
  };
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const auth = await requireCompleteUser();

  if ("response" in auth) {
    return auth.response;
  }

  const supabase = await createSupabaseServerClient();
  const targetProfile = await getProfileByHandle(
    supabase,
    normalizeUsername(params.targetHandle)
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

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", auth.user.id)
    .eq("following_id", targetProfile.id);

  if (error) {
    return NextResponse.json(
      {
        error: {
          code: "UNFOLLOW_FAILED",
          message: error.message,
        },
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    data: {
      following: false,
      targetHandle: targetProfile.handle,
    },
  });
}
