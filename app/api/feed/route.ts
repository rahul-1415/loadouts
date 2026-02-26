import { NextResponse } from "next/server";
import { requireCompleteUser } from "../../../lib/auth/api";
import { decodeFeedCursor, getFollowingFeedByUserId } from "../../../lib/data/feed";

export async function GET(request: Request) {
  const auth = await requireCompleteUser();

  if ("response" in auth) {
    return auth.response;
  }

  const url = new URL(request.url);
  const requestedLimit = Number(url.searchParams.get("limit"));
  const limit =
    Number.isFinite(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, 100)
      : 24;
  const cursor = decodeFeedCursor(url.searchParams.get("cursor"));

  try {
    const data = await getFollowingFeedByUserId({
      userId: auth.user.id,
      limit,
      cursor,
    });
    return NextResponse.json({ data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch feed";

    return NextResponse.json(
      {
        error: {
          code: "FETCH_FAILED",
          message,
        },
      },
      { status: 500 }
    );
  }
}
