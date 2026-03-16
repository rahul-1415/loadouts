import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "../../lib/supabase/server";
import { decodeFeedCursor, getFollowingFeedByUserId } from "../../lib/data/feed";
import { getQueryParam } from "../../lib/auth/redirect";

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

interface FeedPageProps {
  searchParams?: {
    cursor?: string | string[];
  };
}

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/feed");
  }

  const cursor = decodeFeedCursor(getQueryParam(searchParams?.cursor));
  const feed = await getFollowingFeedByUserId({
    userId: user.id,
    limit: 24,
    cursor,
  });
  const items = feed.items;

  return (
    <div className="space-y-8 text-[#f4f5f7]">
      <header className="space-y-3">
        <p className="text-[11px] uppercase tracking-[0.45em] text-white/50">
          Following Feed
        </p>
        <h1 className="text-[clamp(2.1rem,4vw,3.2rem)] font-semibold text-white">
          Latest from people you follow
        </h1>
        <p className="text-sm text-white/70">
          New public loadouts published by creators in your network.
        </p>
      </header>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-white/[0.05] bg-[#171717] p-7">
          <p className="text-sm text-white/70">
            Your feed is empty. Follow creators to see their latest loadouts
            here.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/loadouts/${item.slug}`}
                className="overflow-hidden rounded-3xl border border-white/[0.04] bg-[#171717] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_18px_36px_rgba(0,0,0,0.16)] transition hover:border-white/[0.14]"
              >
                <div
                  className={
                    item.coverImageUrl
                      ? "h-40 w-full bg-[linear-gradient(180deg,rgba(230,239,146,0.12),transparent_58%),linear-gradient(135deg,#2d301d,#171915_62%,#101010)]"
                      : "h-40 w-full bg-[#111111]"
                  }
                >
                  {item.coverImageUrl ? (
                    <img
                      src={item.coverImageUrl}
                      alt={item.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : null}
                </div>
                <div className="space-y-3 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] uppercase tracking-[0.25em] text-white/55">
                      {item.author}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold text-white">{item.title}</h2>
                  <p className="text-sm text-white/70">{item.description}</p>
                </div>
              </Link>
            ))}
          </div>

          {feed.hasMore && feed.nextCursor ? (
            <div className="flex justify-center">
              <Link
                href={`/feed?cursor=${encodeURIComponent(feed.nextCursor)}`}
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
