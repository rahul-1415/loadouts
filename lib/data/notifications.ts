import { createSupabaseServerClient } from "../supabase/server";

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

  let actorById = new Map<string, ActorProfileRow>();

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

  const items = pageRows.map((row) => {
    const actor = actorById.get(row.actor_id);
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
