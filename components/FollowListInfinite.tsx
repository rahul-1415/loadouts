"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import FollowButton from "./FollowButton";

export interface FollowListItemView {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string;
  viewerIsFollowing: boolean;
}

interface FollowListInfiniteProps {
  apiPath: string;
  initialItems: FollowListItemView[];
  initialNextCursor: string | null;
  initialHasMore: boolean;
  emptyMessage: string;
  viewerUserId: string | null;
}

interface FollowListApiPayload {
  data?: {
    items?: FollowListItemView[];
    nextCursor?: string | null;
    hasMore?: boolean;
  };
}

export default function FollowListInfinite({
  apiPath,
  initialItems,
  initialNextCursor,
  initialHasMore,
  emptyMessage,
  viewerUserId,
}: FollowListInfiniteProps) {
  const [items, setItems] = useState(initialItems);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const params = new URLSearchParams();

    if (nextCursor) {
      params.set("cursor", nextCursor);
    }

    params.set("limit", "24");

    const response = await fetch(`${apiPath}?${params.toString()}`);

    if (!response.ok) {
      setMessage("Unable to load more right now.");
      setIsLoading(false);
      return;
    }

    const payload = (await response.json().catch(() => null)) as
      | FollowListApiPayload
      | null;

    const nextItems = payload?.data?.items ?? [];

    setItems((current) => {
      const seen = new Set(current.map((item) => item.id));
      const filtered = nextItems.filter((item) => !seen.has(item.id));
      return [...current, ...filtered];
    });

    setNextCursor(payload?.data?.nextCursor ?? null);
    setHasMore(Boolean(payload?.data?.hasMore));
    setIsLoading(false);
  }, [apiPath, hasMore, isLoading, nextCursor]);

  useEffect(() => {
    const element = sentinelRef.current;

    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMore();
        }
      },
      {
        rootMargin: "150px",
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [loadMore]);

  if (items.length === 0) {
    return <p className="text-sm text-white/70">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <article
          key={item.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#11131a] p-4"
        >
          <Link href={`/profile/${item.handle}`} className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-3">
              <div className="h-10 w-10 overflow-hidden rounded-full border border-white/20 bg-white/10">
                {item.avatarUrl ? (
                  <img
                    src={item.avatarUrl}
                    alt={item.displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-xs font-semibold uppercase text-white/70">
                    {(item.displayName[0] ?? "U").toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {item.displayName}
                </p>
                <p className="truncate text-xs uppercase tracking-[0.2em] text-white/55">
                  @{item.handle}
                </p>
                {item.bio ? (
                  <p className="truncate text-xs text-white/60">{item.bio}</p>
                ) : null}
              </div>
            </div>
          </Link>

          <FollowButton
            targetHandle={item.handle}
            initialFollowing={item.viewerIsFollowing}
            canFollow={Boolean(viewerUserId && viewerUserId !== item.id)}
            compact
          />
        </article>
      ))}

      <div ref={sentinelRef} className="h-8" />

      {isLoading ? (
        <p className="text-xs uppercase tracking-[0.2em] text-white/55">
          Loading more
        </p>
      ) : null}

      {message ? (
        <p className="text-xs uppercase tracking-[0.2em] text-white/55">
          {message}
        </p>
      ) : null}
    </div>
  );
}
