import { NextResponse } from "next/server";
import {
  getFollowStats,
  getPublicLoadoutCountByOwner,
  getPublicLoadoutsByOwner,
  getPublicProfileByIdentifier,
  getViewerFollowsTarget,
} from "../../../../lib/data/profiles";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

interface RouteContext {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: RouteContext) {
  const url = new URL(request.url);
  const requestedLimit = Number(url.searchParams.get("limit"));
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(Math.trunc(requestedLimit), 1), 50)
    : 24;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const viewerUserId = user?.id ?? null;
    const profile = await getPublicProfileByIdentifier(params.id, supabase);

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

    const [stats, loadouts, loadoutsCount, viewerIsFollowing] = await Promise.all([
      getFollowStats(profile.id, supabase),
      getPublicLoadoutsByOwner(profile.id, profile, limit, supabase),
      getPublicLoadoutCountByOwner(profile.id, supabase),
      getViewerFollowsTarget(viewerUserId, profile.id, supabase),
    ]);

    return NextResponse.json({
      data: {
        profile: {
          ...profile,
          path: `/profile/${profile.handle}`,
          followersPath: `/profile/${profile.handle}/followers`,
          followingPath: `/profile/${profile.handle}/following`,
        },
        stats: {
          ...stats,
          loadoutsCount,
        },
        viewer: {
          isAuthenticated: Boolean(viewerUserId),
          isOwner: viewerUserId === profile.id,
          isFollowing: viewerIsFollowing,
        },
        loadouts: loadouts.map((loadout) => ({
          ...loadout,
          path: `/loadouts/${loadout.slug}`,
        })),
        meta: {
          limit,
          returned: loadouts.length,
        },
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch user profile.";

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
