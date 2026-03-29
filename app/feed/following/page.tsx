import { redirect } from "next/navigation";
import { ButtonLink } from "../../../components/Button";
import FeedLoadoutGrid from "../../../components/FeedLoadoutGrid";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import { decodeFeedCursor, getFollowingFeedByUserId } from "../../../lib/data/feed";
import { getQueryParam } from "../../../lib/auth/redirect";

interface FollowingFeedPageProps {
  searchParams?: {
    cursor?: string | string[];
  };
}

export default async function FollowingFeedPage({
  searchParams,
}: FollowingFeedPageProps) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/feed/following");
  }

  const cursor = decodeFeedCursor(getQueryParam(searchParams?.cursor));
  const feed = await getFollowingFeedByUserId({
    userId: user.id,
    limit: 24,
    cursor,
  });

  return (
    <div className="space-y-8 text-[#f4f5f7]">
      <header className="space-y-4">
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.45em] text-white/50">
            Following Feed
          </p>
          <h1 className="text-[clamp(2.1rem,4vw,3.2rem)] font-semibold text-white">
            Latest from people you follow
          </h1>
          <p className="text-sm text-white/70">
            Stay focused on new public loadouts from creators already in your
            network.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/feed" variant="secondary">
            All Posts
          </ButtonLink>
          <ButtonLink href="/feed/following">Following</ButtonLink>
        </div>
      </header>

      {feed.items.length === 0 ? (
        <div className="rounded-3xl border border-white/[0.05] bg-[#171717] p-7">
          <p className="text-sm text-white/70">
            Your following feed is empty. Follow a few creators from profiles,
            categories, or the main feed to get a focused stream here.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <ButtonLink href="/feed" variant="secondary">
              Browse All Posts
            </ButtonLink>
            <ButtonLink href="/categories">Explore Categories</ButtonLink>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <FeedLoadoutGrid items={feed.items} />

          {feed.hasMore && feed.nextCursor ? (
            <div className="flex justify-center">
              <ButtonLink
                href={`/feed/following?cursor=${encodeURIComponent(feed.nextCursor)}`}
                variant="secondary"
              >
                Load more
              </ButtonLink>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
