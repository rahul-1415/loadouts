import { redirect } from "next/navigation";
import Link from "next/link";
import { getQueryParam } from "../../lib/auth/redirect";
import { createSupabaseServerClient } from "../../lib/supabase/server";
import { trackMilestoneEvent } from "../../lib/data/analytics";
import {
  decodeNotificationCursor,
  getNotificationsByRecipient,
  markNotificationsRead,
} from "../../lib/data/notifications";

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function notificationLabel(type: string) {
  if (type === "follow") {
    return "started following you";
  }

  if (type === "like") {
    return "liked your loadout";
  }

  if (type === "comment") {
    return "commented on your loadout";
  }

  if (type === "loadout_published") {
    return "published a loadout";
  }

  return "sent an update";
}

interface NotificationsPageProps {
  searchParams?: {
    cursor?: string | string[];
  };
}

export default async function NotificationsPage({
  searchParams,
}: NotificationsPageProps) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/notifications");
  }

  const cursor = decodeNotificationCursor(getQueryParam(searchParams?.cursor));
  const notificationPage = await getNotificationsByRecipient({
    recipientId: user.id,
    limit: 30,
    cursor,
  });
  const notifications = notificationPage.items;
  const unreadIds = notifications
    .filter((item) => !item.isRead)
    .map((item) => item.id);

  if (notifications.length > 0) {
    try {
      await trackMilestoneEvent({
        userId: user.id,
        eventName: "first_notification_received",
        metadata: {
          source: "notifications_page",
        },
      });
    } catch {
      // Non-blocking for notifications view.
    }
  }

  if (unreadIds.length > 0) {
    await markNotificationsRead(user.id, unreadIds);
  }

  return (
    <div className="space-y-8 text-[#f4f5f7]">
      <header className="space-y-3">
        <p className="text-[11px] uppercase tracking-[0.45em] text-white/50">
          Notifications
        </p>
        <h1 className="text-[clamp(2rem,3.8vw,3rem)] font-semibold text-white">
          Recent activity
        </h1>
      </header>

      {notifications.length === 0 ? (
        <div className="rounded-3xl border border-white/12 bg-[#11131a] p-7">
          <p className="text-sm text-white/70">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="space-y-3">
            {notifications.map((item) => (
              <article
                key={item.id}
                className={`rounded-2xl border px-4 py-3 ${
                  item.isRead
                    ? "border-white/10 bg-[#11131a]"
                    : "border-white/25 bg-[#151a22]"
                }`}
              >
                <p className="text-sm text-white/80">
                  <span className="font-semibold text-white">
                    {item.actor.displayName || item.actor.handle || "Someone"}
                  </span>{" "}
                  {notificationLabel(item.type)}.
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-white/45">
                  {formatDate(item.createdAt)}
                </p>
              </article>
            ))}
          </div>

          {notificationPage.hasMore && notificationPage.nextCursor ? (
            <div className="flex justify-center">
              <Link
                href={`/notifications?cursor=${encodeURIComponent(
                  notificationPage.nextCursor
                )}`}
                className="rounded-full border border-white/20 px-5 py-2 text-xs uppercase tracking-[0.25em] text-white/75 transition hover:border-white/45 hover:text-white"
              >
                Load more
              </Link>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
