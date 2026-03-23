import { redirect } from "next/navigation";
import Link from "next/link";
import { ButtonLink } from "../../components/Button";
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

function actorLabel(displayName: string | null, handle: string | null) {
  if (displayName) {
    return displayName;
  }

  if (handle) {
    return `@${handle}`;
  }

  return "Someone";
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
        <div className="rounded-3xl border border-white/[0.05] bg-[#171717] p-7">
          <p className="text-[11px] uppercase tracking-[0.35em] text-white/55">
            No Activity Yet
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Give people something to react to
          </h2>
          <p className="mt-2 text-sm text-white/70">
            Notifications appear when other creators follow you, like a loadout,
            or join the conversation. Publishing a loadout and following a few
            creators is the fastest way to start the loop.
          </p>
          <div className="mt-4 rounded-2xl border border-white/[0.05] bg-[#111111] px-4 py-4 text-left text-sm text-white/68">
            <p>1. Publish a public loadout from Studio.</p>
            <p className="mt-2">2. Follow creators whose setups you want to track.</p>
            <p className="mt-2">3. Comment on loadouts to start discussion threads.</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <ButtonLink href="/studio">Open Studio</ButtonLink>
            <ButtonLink href="/feed" variant="secondary">
              Browse Feed
            </ButtonLink>
            <ButtonLink href="/categories" variant="secondary">
              Explore Categories
            </ButtonLink>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="space-y-3">
            {notifications.map((item) => (
              <article
                key={item.id}
                className={`rounded-2xl border px-4 py-3 ${
                  item.isRead
                    ? "border-white/[0.04] bg-[#171717]"
                    : "border-white/[0.12] bg-[#151a22]"
                }`}
              >
                <p className="text-sm text-white/80">
                  {item.actor.handle ? (
                    <Link
                      href={`/profile/${item.actor.handle}`}
                      className="font-semibold text-white underline decoration-white/18 underline-offset-4 transition hover:text-[#e6ef92]"
                    >
                      {actorLabel(item.actor.displayName, item.actor.handle)}
                    </Link>
                  ) : (
                    <span className="font-semibold text-white">
                      {actorLabel(item.actor.displayName, item.actor.handle)}
                    </span>
                  )}{" "}
                  {notificationLabel(item.type)}.
                </p>
                {item.contextText ? (
                  <p className="mt-2 text-xs uppercase tracking-[0.22em] text-white/50">
                    {item.contextText}
                  </p>
                ) : null}
                {item.previewText ? (
                  <p className="mt-2 text-sm text-white/68">
                    “{item.previewText}”
                  </p>
                ) : null}
                {item.targetHref && item.targetLabel ? (
                  <div className="mt-3">
                    <Link
                      href={item.targetHref}
                      className="inline-flex rounded-full border border-white/[0.08] px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-white/72 transition hover:border-white/[0.18] hover:text-white"
                    >
                      {item.targetLabel}
                    </Link>
                  </div>
                ) : null}
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
                className="rounded-full border border-white/[0.08] px-5 py-2 text-xs uppercase tracking-[0.25em] text-white/75 transition hover:border-white/[0.22] hover:text-white"
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
