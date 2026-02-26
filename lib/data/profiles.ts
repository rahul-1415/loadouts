import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "../supabase/server";
import { normalizeUsername } from "../auth/username";
import type { CollectionListItem } from "./collections";

interface ProfileRow {
  id: string;
  handle: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  interests: string[] | null;
}

interface CollectionRow {
  id: string;
  slug: string;
  kind: "category" | "loadout";
  title: string;
  description: string | null;
  cover_image_url: string | null;
}

interface FollowRow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface PublicProfile {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string;
  interests: string[];
}

export interface ProfileStats {
  followersCount: number;
  followingCount: number;
}

export interface FollowListItem {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string;
  viewerIsFollowing: boolean;
}

export type FollowDirection = "followers" | "following";

export interface FollowCursor {
  createdAt: string;
  userId: string;
}

export interface FollowListResult {
  items: FollowListItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

function toPublicProfile(row: ProfileRow): PublicProfile | null {
  if (!row.handle || !row.display_name) {
    return null;
  }

  return {
    id: row.id,
    handle: row.handle,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    bio: row.bio ?? "",
    interests: row.interests ?? [],
  };
}

function getAuthorLabel(profile: PublicProfile) {
  return `@${profile.handle}`;
}

function encodeCursor(cursor: FollowCursor) {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

export function decodeCursor(value: string | null): FollowCursor | null {
  if (!value) {
    return null;
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8")
    ) as Partial<FollowCursor>;

    if (
      typeof decoded.createdAt !== "string" ||
      typeof decoded.userId !== "string"
    ) {
      return null;
    }

    return {
      createdAt: decoded.createdAt,
      userId: decoded.userId,
    };
  } catch {
    return null;
  }
}

export async function getPublicProfileByHandle(
  handle: string,
  client?: SupabaseClient
): Promise<PublicProfile | null> {
  const supabase = client ?? (await createSupabaseServerClient());
  const normalized = normalizeUsername(handle);

  const { data, error } = await supabase
    .from("profiles")
    .select("id,handle,display_name,avatar_url,bio,interests")
    .eq("handle", normalized)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return toPublicProfile(data as ProfileRow);
}

export async function getPublicProfileByUserId(
  userId: string,
  client?: SupabaseClient
): Promise<PublicProfile | null> {
  const supabase = client ?? (await createSupabaseServerClient());

  const { data, error } = await supabase
    .from("profiles")
    .select("id,handle,display_name,avatar_url,bio,interests")
    .eq("id", userId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return toPublicProfile(data as ProfileRow);
}

export async function getFollowStats(
  userId: string,
  client?: SupabaseClient
): Promise<ProfileStats> {
  const supabase = client ?? (await createSupabaseServerClient());

  const [followersResult, followingResult] = await Promise.all([
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userId),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", userId),
  ]);

  if (followersResult.error) {
    throw new Error(followersResult.error.message);
  }

  if (followingResult.error) {
    throw new Error(followingResult.error.message);
  }

  return {
    followersCount: followersResult.count ?? 0,
    followingCount: followingResult.count ?? 0,
  };
}

export async function getViewerFollowsTarget(
  viewerUserId: string | null,
  targetUserId: string,
  client?: SupabaseClient
) {
  if (!viewerUserId || viewerUserId === targetUserId) {
    return false;
  }

  const supabase = client ?? (await createSupabaseServerClient());
  const { data, error } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", viewerUserId)
    .eq("following_id", targetUserId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

export async function getPublicLoadoutsByOwner(
  ownerId: string,
  authorProfile: PublicProfile,
  limit = 24,
  client?: SupabaseClient
): Promise<CollectionListItem[]> {
  const supabase = client ?? (await createSupabaseServerClient());

  const { data, error } = await supabase
    .from("collections")
    .select("id,slug,kind,title,description,cover_image_url")
    .eq("owner_id", ownerId)
    .eq("kind", "loadout")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as CollectionRow[];

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    kind: row.kind,
    ownerId,
    title: row.title,
    description: row.description ?? "",
    author: getAuthorLabel(authorProfile),
    coverImageUrl: row.cover_image_url,
    coverImageSourceUrl: null,
  }));
}

function getListedUserId(row: FollowRow, direction: FollowDirection) {
  return direction === "followers" ? row.follower_id : row.following_id;
}

function getCursorUserIdColumn(direction: FollowDirection) {
  return direction === "followers" ? "follower_id" : "following_id";
}

function getScopeColumn(direction: FollowDirection) {
  return direction === "followers" ? "following_id" : "follower_id";
}

export async function getFollowListByUserId({
  targetUserId,
  direction,
  viewerUserId,
  limit,
  cursor,
  client,
}: {
  targetUserId: string;
  direction: FollowDirection;
  viewerUserId: string | null;
  limit: number;
  cursor: FollowCursor | null;
  client?: SupabaseClient;
}): Promise<FollowListResult> {
  const supabase = client ?? (await createSupabaseServerClient());
  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const scopeColumn = getScopeColumn(direction);
  const cursorUserIdColumn = getCursorUserIdColumn(direction);

  let query = supabase
    .from("follows")
    .select("follower_id,following_id,created_at")
    .eq(scopeColumn, targetUserId)
    .order("created_at", { ascending: false })
    .order(cursorUserIdColumn, { ascending: false })
    .limit(safeLimit + 1);

  if (cursor) {
    query = query.or(
      `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},${cursorUserIdColumn}.lt.${cursor.userId})`
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as FollowRow[];
  const hasMore = rows.length > safeLimit;
  const pageRows = hasMore ? rows.slice(0, safeLimit) : rows;
  const listedUserIds = pageRows.map((row) => getListedUserId(row, direction));

  if (listedUserIds.length === 0) {
    return {
      items: [],
      nextCursor: null,
      hasMore: false,
    };
  }

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id,handle,display_name,avatar_url,bio")
    .in("id", listedUserIds);

  if (profileError) {
    throw new Error(profileError.message);
  }

  const profileRows = (profileData ?? []) as Array<
    Omit<ProfileRow, "interests">
  >;
  const profileById = new Map(profileRows.map((row) => [row.id, row]));

  let viewerFollowingIds = new Set<string>();

  if (viewerUserId) {
    const { data: followingData, error: followingError } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", viewerUserId)
      .in("following_id", listedUserIds);

    if (followingError) {
      throw new Error(followingError.message);
    }

    viewerFollowingIds = new Set(
      (followingData ?? []).map((row) => row.following_id as string)
    );
  }

  const items: FollowListItem[] = pageRows
    .map((row) => {
      const listedUserId = getListedUserId(row, direction);
      const profileRow = profileById.get(listedUserId);

      if (!profileRow?.handle || !profileRow.display_name) {
        return null;
      }

      return {
        id: profileRow.id,
        handle: profileRow.handle,
        displayName: profileRow.display_name,
        avatarUrl: profileRow.avatar_url,
        bio: profileRow.bio ?? "",
        viewerIsFollowing:
          viewerUserId != null && viewerUserId !== profileRow.id
            ? viewerFollowingIds.has(profileRow.id)
            : false,
      } as FollowListItem;
    })
    .filter((item): item is FollowListItem => item !== null);

  const lastRow = pageRows[pageRows.length - 1];
  const nextCursor =
    hasMore && lastRow
      ? encodeCursor({
          createdAt: lastRow.created_at,
          userId: getListedUserId(lastRow, direction),
        })
      : null;

  return {
    items,
    nextCursor,
    hasMore,
  };
}
