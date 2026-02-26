import { NextResponse } from "next/server";
import { requireCompleteUser } from "../../../lib/auth/api";
import { trackMilestoneEvent } from "../../../lib/data/analytics";
import {
  decodeNotificationCursor,
  getNotificationsByRecipient,
  markNotificationsRead,
} from "../../../lib/data/notifications";

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
  const cursor = decodeNotificationCursor(url.searchParams.get("cursor"));

  try {
    const data = await getNotificationsByRecipient({
      recipientId: auth.user.id,
      limit,
      cursor,
    });

    if (data.items.length > 0) {
      try {
        await trackMilestoneEvent({
          userId: auth.user.id,
          eventName: "first_notification_received",
          metadata: {
            source: "notifications_api",
          },
        });
      } catch {
        // Non-blocking for notifications fetch.
      }
    }

    return NextResponse.json({ data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch notifications";

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

export async function PATCH(request: Request) {
  const auth = await requireCompleteUser();

  if ("response" in auth) {
    return auth.response;
  }

  try {
    const body = await request.json().catch(() => null);
    const ids = Array.isArray(body?.ids)
      ? body.ids.filter((id: unknown): id is string => typeof id === "string")
      : [];

    await markNotificationsRead(auth.user.id, ids.length > 0 ? ids : undefined);
    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to mark notifications read";

    return NextResponse.json(
      {
        error: {
          code: "UPDATE_FAILED",
          message,
        },
      },
      { status: 500 }
    );
  }
}
