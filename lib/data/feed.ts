import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "../supabase/server";
import { getPublicProfileByUserId } from "./profiles";

interface FeedLoadoutRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  owner_id: string;
  published_at: string | null;
  created_at: string;
  status?: string | null;
}

interface FeedCountRow {
  collection_id: string;
}

export type FeedSort = "recent" | "likes" | "comments";

export interface FeedItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverImageUrl: string | null;
  author: string;
  createdAt: string;
  publishedAt: string | null;
  likeCount: number;
  commentCount: number;
}

export interface FeedCursor {
  createdAt: string;
  loadoutId: string;
}

export interface FollowingFeedResult {
  items: FeedItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface PublicFeedResult {
  items: FeedItem[];
  page: number;
  totalCount: number;
  hasMore: boolean;
  sort: FeedSort;
}

const MAX_PUBLIC_FEED_SCAN = 500;

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

function getItemTimestamp(item: Pick<FeedItem, "publishedAt" | "createdAt">) {
  return item.publishedAt ?? item.createdAt;
}

function compareByRecency(
  left: Pick<FeedItem, "id" | "publishedAt" | "createdAt">,
  right: Pick<FeedItem, "id" | "publishedAt" | "createdAt">
) {
  const leftStamp = getItemTimestamp(left);
  const rightStamp = getItemTimestamp(right);

  if (leftStamp !== rightStamp) {
    return rightStamp.localeCompare(leftStamp);
  }

  return right.id.localeCompare(left.id);
}

function sortItems(items: FeedItem[], sort: FeedSort) {
  const sorted = [...items];

  if (sort === "likes") {
    sorted.sort((left, right) => {
      if (left.likeCount !== right.likeCount) {
        return right.likeCount - left.likeCount;
      }

      return compareByRecency(left, right);
    });
    return sorted;
  }

  if (sort === "comments") {
    sorted.sort((left, right) => {
      if (left.commentCount !== right.commentCount) {
        return right.commentCount - left.commentCount;
      }

      return compareByRecency(left, right);
    });
    return sorted;
  }

  sorted.sort(compareByRecency);
  return sorted;
}

async function countByCollectionIds(
  table: "likes" | "comments",
  collectionIds: string[],
  client?: SupabaseClient
) {
  if (collectionIds.length === 0) {
    return new Map<string, number>();
  }

  const supabase = client ?? (await createSupabaseServerClient());
  const { data, error } = await supabase
    .from(table)
    .select("collection_id")
    .in("collection_id", collectionIds);

  if (error) {
    throw new Error(error.message);
  }

  const counts = new Map<string, number>();

  ((data ?? []) as FeedCountRow[]).forEach((row) => {
    counts.set(row.collection_id, (counts.get(row.collection_id) ?? 0) + 1);
  });

  return counts;
}

async function buildFeedItems(rows: FeedLoadoutRow[]) {
  const supabase = await createSupabaseServerClient();
  const owners = Array.from(new Set(rows.map((row) => row.owner_id)));
  const ownerProfiles = await Promise.all(
    owners.map((ownerId) => getPublicProfileByUserId(ownerId, supabase))
  );
  const ownerLabelById = new Map<string, string>();

  ownerProfiles.forEach((profile) => {
    if (profile) {
      ownerLabelById.set(profile.id, `@${profile.handle}`);
    }
  });

  const collectionIds = rows.map((row) => row.id);
  const [likeCountById, commentCountById] = await Promise.all([
    countByCollectionIds("likes", collectionIds, supabase),
    countByCollectionIds("comments", collectionIds, supabase),
  ]);

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description ?? "",
    coverImageUrl: row.cover_image_url,
    author: ownerLabelById.get(row.owner_id) ?? "@unknown",
    createdAt: row.created_at,
    publishedAt: row.published_at,
    likeCount: likeCountById.get(row.id) ?? 0,
    commentCount: commentCountById.get(row.id) ?? 0,
  }));
}

export function parseFeedSort(value: string | null | undefined): FeedSort {
  if (value === "likes" || value === "comments") {
    return value;
  }

  return "recent";
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
    .select(
      "id,slug,title,description,cover_image_url,owner_id,published_at,created_at,status"
    )
    .eq("kind", "loadout")
    .eq("is_public", true)
    .eq("status", "published")
    .in("owner_id", followingIds)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(safeLimit + 1);

  if (cursor) {
    const cursorTime = normalizeCursorTimestamp(cursor.createdAt);
    query = query.or(
      `published_at.lt.${cursorTime},and(published_at.eq.${cursorTime},id.lt.${cursor.loadoutId})`
    );
  }

  const { data: loadoutRows, error: loadoutError } = await query;

  if (loadoutError) {
    throw new Error(loadoutError.message);
  }

  const rows = (loadoutRows ?? []) as FeedLoadoutRow[];
  const hasMore = rows.length > safeLimit;
  const pageRows = hasMore ? rows.slice(0, safeLimit) : rows;
  const items = await buildFeedItems(pageRows);

  const lastRow = pageRows[pageRows.length - 1];
  const nextCursor =
    hasMore && lastRow
      ? encodeCursor({
          createdAt: lastRow.published_at ?? lastRow.created_at,
          loadoutId: lastRow.id,
        })
      : null;

  return {
    items,
    nextCursor,
    hasMore,
  };
}

export async function getPublicFeed({
  limit = 24,
  page = 1,
  sort = "recent",
}: {
  limit?: number;
  page?: number;
  sort?: FeedSort;
} = {}): Promise<PublicFeedResult> {
  const supabase = await createSupabaseServerClient();
  const safeLimit = Math.min(Math.max(limit, 1), 60);
  const safePage = Math.max(page, 1);
  const scanLimit = Math.max(
    Math.min(safePage * safeLimit + safeLimit, MAX_PUBLIC_FEED_SCAN),
    120
  );

  const { data, error } = await supabase
    .from("collections")
    .select(
      "id,slug,title,description,cover_image_url,owner_id,published_at,created_at,status"
    )
    .eq("kind", "loadout")
    .eq("is_public", true)
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(scanLimit);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as FeedLoadoutRow[];
  const items = sortItems(await buildFeedItems(rows), sort);
  const start = (safePage - 1) * safeLimit;
  const pagedItems = items.slice(start, start + safeLimit);

  return {
    items: pagedItems,
    page: safePage,
    totalCount: items.length,
    hasMore: start + safeLimit < items.length,
    sort,
  };
}
