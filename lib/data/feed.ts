import { createSupabaseServerClient } from "../supabase/server";
import { getPublicProfileByUserId } from "./profiles";

interface FeedLoadoutRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  owner_id: string;
  created_at: string;
}

export interface FollowingFeedItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverImageUrl: string | null;
  author: string;
  createdAt: string;
}

export interface FeedCursor {
  createdAt: string;
  loadoutId: string;
}

export interface FollowingFeedResult {
  items: FollowingFeedItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

function encodeCursor(cursor: FeedCursor) {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

function normalizeCursorTimestamp(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toISOString();
}

export function decodeFeedCursor(value: string | null): FeedCursor | null {
  if (!value) {
    return null;
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8")
    ) as Partial<FeedCursor>;

    if (
      typeof decoded.createdAt !== "string" ||
      typeof decoded.loadoutId !== "string"
    ) {
      return null;
    }

    return {
      createdAt: decoded.createdAt,
      loadoutId: decoded.loadoutId,
    };
  } catch {
    return null;
  }
}

export async function getFollowingFeedByUserId({
  userId,
  limit = 24,
  cursor,
}: {
  userId: string;
  limit?: number;
  cursor?: FeedCursor | null;
}): Promise<FollowingFeedResult> {
  const supabase = await createSupabaseServerClient();
  const safeLimit = Math.min(Math.max(limit, 1), 100);

  const { data: followingRows, error: followingError } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId)
    .limit(400);

  if (followingError) {
    throw new Error(followingError.message);
  }

  const followingIds = Array.from(
    new Set((followingRows ?? []).map((row) => row.following_id as string))
  );

  if (followingIds.length === 0) {
    return {
      items: [],
      nextCursor: null,
      hasMore: false,
    };
  }

  let query = supabase
    .from("collections")
    .select("id,slug,title,description,cover_image_url,owner_id,created_at")
    .eq("kind", "loadout")
    .eq("is_public", true)
    .in("owner_id", followingIds)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(safeLimit + 1);

  if (cursor) {
    const cursorTime = normalizeCursorTimestamp(cursor.createdAt);
    query = query.or(
      `created_at.lt.${cursorTime},and(created_at.eq.${cursorTime},id.lt.${cursor.loadoutId})`
    );
  }

  const { data: loadoutRows, error: loadoutError } = await query;

  if (loadoutError) {
    throw new Error(loadoutError.message);
  }

  const rows = (loadoutRows ?? []) as FeedLoadoutRow[];
  const hasMore = rows.length > safeLimit;
  const pageRows = hasMore ? rows.slice(0, safeLimit) : rows;
  const owners = Array.from(new Set(pageRows.map((row) => row.owner_id)));
  const ownerProfiles = await Promise.all(
    owners.map((ownerId) => getPublicProfileByUserId(ownerId, supabase))
  );
  const ownerLabelById = new Map<string, string>();

  ownerProfiles.forEach((profile) => {
    if (profile) {
      ownerLabelById.set(profile.id, `@${profile.handle}`);
    }
  });

  const items = pageRows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description ?? "",
    coverImageUrl: row.cover_image_url,
    author: ownerLabelById.get(row.owner_id) ?? "@unknown",
    createdAt: row.created_at,
  }));

  const lastRow = pageRows[pageRows.length - 1];
  const nextCursor =
    hasMore && lastRow
      ? encodeCursor({
          createdAt: lastRow.created_at,
          loadoutId: lastRow.id,
        })
      : null;

  return {
    items,
    nextCursor,
    hasMore,
  };
}
