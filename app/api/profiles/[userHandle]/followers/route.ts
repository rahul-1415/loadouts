import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../../lib/supabase/server";
import {
  decodeCursor,
  getFollowListByUserId,
  getPublicProfileByHandle,
} from "../../../../../lib/data/profiles";

interface RouteContext {
  params: {
    userHandle: string;
  };
}

export async function GET(request: Request, { params }: RouteContext) {
  const url = new URL(request.url);
  const limitValue = Number(url.searchParams.get("limit"));
  const limit = Number.isFinite(limitValue) ? limitValue : 24;
  const cursor = decodeCursor(url.searchParams.get("cursor"));

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = await getPublicProfileByHandle(params.userHandle, supabase);

  if (!profile) {
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

  const list = await getFollowListByUserId({
    targetUserId: profile.id,
    direction: "followers",
    viewerUserId: user?.id ?? null,
    limit,
    cursor,
    client: supabase,
  });

  return NextResponse.json({
    data: {
      profile: {
        handle: profile.handle,
        displayName: profile.displayName,
      },
      ...list,
    },
  });
}
