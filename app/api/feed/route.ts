import { NextResponse } from "next/server";
import { requireUser } from "../../../lib/auth/api";
import {
  decodeFeedCursor,
  getFollowingFeedByUserId,
  getPublicFeed,
  parseFeedSort,
} from "../../../lib/data/feed";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const scope = url.searchParams.get("scope") === "following" ? "following" : "all";
  const requestedLimit = Number(url.searchParams.get("limit"));
  const limit =
    Number.isFinite(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, 100)
      : 24;
  const sort = parseFeedSort(url.searchParams.get("sort"));
  const requestedPage = Number(url.searchParams.get("page"));
  const page =
    Number.isFinite(requestedPage) && requestedPage > 0
      ? Math.floor(requestedPage)
      : 1;

  try {
    if (scope === "following") {
      const auth = await requireUser();

      if ("response" in auth) {
        return auth.response;
      }

      const cursor = decodeFeedCursor(url.searchParams.get("cursor"));
      const data = await getFollowingFeedByUserId({
        userId: auth.user.id,
        limit,
        cursor,
      });
      return NextResponse.json({ data });
    }

    const data = await getPublicFeed({
      limit,
      page,
      sort,
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
