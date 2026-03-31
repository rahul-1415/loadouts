import { createSupabaseServerClient } from "../supabase/server";
import { getCollectionPath } from "./collections";

export type NotificationType =
  | "follow"
  | "like"
  | "comment"
  | "loadout_published";

interface NotificationRow {
  id: string;
  recipient_id: string;
  actor_id: string;
  type: NotificationType;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

interface ActorProfileRow {
  id: string;
  handle: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

interface NotificationCollectionRow {
  id: string;
  slug: string;
  kind: "category" | "loadout";
  title: string;
  owner_id: string;
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
  actor: {
    id: string;
    handle: string | null;
    displayName: string | null;
    avatarUrl: string | null;
  };
  targetHref: string | null;
  targetLabel: string | null;
  contextText: string | null;
  previewText: string | null;
}

export interface NotificationCursor {
  createdAt: string;
  notificationId: string;
}

export interface NotificationListResult {
  items: NotificationItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

function encodeCursor(cursor: NotificationCursor) {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

function normalizeCursorTimestamp(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toISOString();
}

function getMetadataString(
  metadata: Record<string, unknown> | null,
  key: string
) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getCollectionIdForNotification(row: NotificationRow) {
  const metadataCollectionId = getMetadataString(row.metadata, "collectionId");

  if (metadataCollectionId) {
    return metadataCollectionId;
  }

  if (
    row.entity_id &&
    (row.entity_type === "collection" || row.entity_type === "loadout")
  ) {
    return row.entity_id;
  }

  return null;
}

function getCollectionHref(
  collection: NotificationCollectionRow,
  authorHandle: string | null
) {
  return getCollectionPath({
    kind: collection.kind,
    slug: collection.slug,
    authorHandle,
  });
}

export function decodeNotificationCursor(
  value: string | null
): NotificationCursor | null {
  if (!value) {
    return null;
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8")
    ) as Partial<NotificationCursor>;

    if (
      typeof decoded.createdAt !== "string" ||
      typeof decoded.notificationId !== "string"
    ) {
      return null;
    }

    return {
      createdAt: decoded.createdAt,
      notificationId: decoded.notificationId,
    };
  } catch {
    return null;
  }
}

export async function createNotification({
  recipientId,
  actorId,
  type,
  entityType,
  entityId,
  metadata,
}: {
  recipientId: string;
  actorId: string;
  type: NotificationType;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  if (recipientId === actorId) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("notifications").insert({
    recipient_id: recipientId,
    actor_id: actorId,
    type,
    entity_type: entityType,
    entity_id: entityId ?? null,
    metadata: metadata ?? null,
  });

  if (error) {
    if (error.code === "23505") {
      return;
    }

    if (error.code === "42P01" || error.code === "PGRST205") {
      return;
    }

    throw new Error(error.message);
  }
}

export async function getNotificationsByRecipient({
  recipientId,
  limit = 24,
  cursor,
}: {
  recipientId: string;
  limit?: number;
  cursor?: NotificationCursor | null;
}): Promise<NotificationListResult> {
  const supabase = await createSupabaseServerClient();
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  let query = supabase
    .from("notifications")
    .select(
      "id,recipient_id,actor_id,type,entity_type,entity_id,metadata,is_read,created_at"
    )
    .eq("recipient_id", recipientId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(safeLimit + 1);

  if (cursor) {
    const cursorTime = normalizeCursorTimestamp(cursor.createdAt);
    query = query.or(
      `created_at.lt.${cursorTime},and(created_at.eq.${cursorTime},id.lt.${cursor.notificationId})`
    );
  }

  const { data, error } = await query;

  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") {
      return {
        items: [],
        nextCursor: null,
        hasMore: false,
      };
    }

    throw new Error(error.message);
  }

  const rows = (data ?? []) as NotificationRow[];
  const hasMore = rows.length > safeLimit;
  const pageRows = hasMore ? rows.slice(0, safeLimit) : rows;
  const actorIds = Array.from(new Set(pageRows.map((row) => row.actor_id)));
  const collectionIds = Array.from(
    new Set(
      pageRows
        .map((row) => getCollectionIdForNotification(row))
        .filter((value): value is string => Boolean(value))
    )
  );

  let actorById = new Map<string, ActorProfileRow>();
  let collectionById = new Map<string, NotificationCollectionRow>();
  let collectionOwnerHandleById = new Map<string, string | null>();

  if (actorIds.length > 0) {
    const { data: actorData, error: actorError } = await supabase
      .from("profiles")
      .select("id,handle,display_name,avatar_url")
      .in("id", actorIds);

    if (actorError) {
      throw new Error(actorError.message);
    }

    actorById = new Map<string, ActorProfileRow>(
      ((actorData ?? []) as ActorProfileRow[]).map((row) => [row.id, row])
    );
  }

  if (collectionIds.length > 0) {
    const { data: collectionData, error: collectionError } = await supabase
      .from("collections")
      .select("id,slug,kind,title,owner_id")
      .in("id", collectionIds);

    if (collectionError) {
      throw new Error(collectionError.message);
    }

    collectionById = new Map<string, NotificationCollectionRow>(
      ((collectionData ?? []) as NotificationCollectionRow[]).map((row) => [
        row.id,
        row,
      ])
    );

    const ownerIds = Array.from(
      new Set(
        ((collectionData ?? []) as NotificationCollectionRow[]).map(
          (row) => row.owner_id
        )
      )
    );

    if (ownerIds.length > 0) {
      const { data: ownerData, error: ownerError } = await supabase
        .from("profiles")
        .select("id,handle")
        .in("id", ownerIds);

      if (ownerError) {
        throw new Error(ownerError.message);
      }

      const ownerHandleById = new Map<string, string | null>(
        ((ownerData ?? []) as Array<{ id: string; handle: string | null }>).map(
          (row) => [row.id, row.handle]
        )
      );

      collectionOwnerHandleById = ownerHandleById;
    }
  }

  const items = pageRows.map((row) => {
    const actor = actorById.get(row.actor_id);
    const previewText = getMetadataString(row.metadata, "preview");
    const collectionId = getCollectionIdForNotification(row);
    const collection = collectionId ? collectionById.get(collectionId) : null;
    const collectionHref = collection
      ? getCollectionHref(
          collection,
          collectionOwnerHandleById.get(collection.owner_id) ?? null
        )
      : null;
    let targetHref: string | null = null;
    let targetLabel: string | null = null;
    let contextText: string | null = null;

    if (row.type === "follow" && actor?.handle) {
      targetHref = `/profile/${actor.handle}`;
      targetLabel = "View profile";
    } else if (row.type === "comment" && collection && collectionHref) {
      targetHref = row.entity_id
        ? `${collectionHref}#comment-${row.entity_id}`
        : collectionHref;
      targetLabel = "View comment";
      contextText = `On ${collection.title}`;
    } else if (row.type === "like" && collection && collectionHref) {
      targetHref = collectionHref;
      targetLabel = collection.kind === "loadout" ? "View loadout" : "View category";
      contextText = `On ${collection.title}`;
    } else if (
      row.type === "loadout_published" &&
      collection &&
      collectionHref
    ) {
      targetHref = collectionHref;
      targetLabel = "View loadout";
      contextText = collection.title;
    } else if (collection && collectionHref) {
      targetHref = collectionHref;
      targetLabel =
        collection.kind === "loadout" ? "Open loadout" : "Open category";
      contextText = collection.title;
    }

    return {
      id: row.id,
      type: row.type,
      entityType: row.entity_type,
      entityId: row.entity_id,
      metadata: row.metadata ?? null,
      isRead: row.is_read,
      createdAt: row.created_at,
      actor: {
        id: row.actor_id,
        handle: actor?.handle ?? null,
        displayName: actor?.display_name ?? null,
        avatarUrl: actor?.avatar_url ?? null,
      },
      targetHref,
      targetLabel,
      contextText,
      previewText,
    } as NotificationItem;
  });

  const lastRow = pageRows[pageRows.length - 1];
  const nextCursor =
    hasMore && lastRow
      ? encodeCursor({
          createdAt: lastRow.created_at,
          notificationId: lastRow.id,
        })
      : null;

  return {
    items,
    nextCursor,
    hasMore,
  };
}

export async function markNotificationsRead(
  recipientId: string,
  notificationIds?: string[]
) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("recipient_id", recipientId);

  if (notificationIds && notificationIds.length > 0) {
    query = query.in("id", notificationIds);
  }

  const { error } = await query;

  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") {
      return;
    }

    throw new Error(error.message);
  }
}
