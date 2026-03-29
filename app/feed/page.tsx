import Link from "next/link";
import { ButtonLink } from "../../components/Button";
import FeedLoadoutGrid from "../../components/FeedLoadoutGrid";
import { getQueryParam } from "../../lib/auth/redirect";
import { getPublicFeed, parseFeedSort, type FeedSort } from "../../lib/data/feed";

interface FeedPageProps {
  searchParams?: {
    page?: string | string[];
    sort?: string | string[];
  };
}

const sortOptions: Array<{ label: string; value: FeedSort }> = [
  { label: "Recent", value: "recent" },
  { label: "Most Liked", value: "likes" },
  { label: "Most Commented", value: "comments" },
];

function getPageNumber(value: string | null) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return Math.floor(parsed);
}

function buildFeedHref({
  page,
  sort,
}: {
  page?: number;
  sort: FeedSort;
}) {
  const params = new URLSearchParams();

  if (sort !== "recent") {
    params.set("sort", sort);
  }

  if (page && page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();
  return query ? `/feed?${query}` : "/feed";
}

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const sort = parseFeedSort(getQueryParam(searchParams?.sort));
  const page = getPageNumber(getQueryParam(searchParams?.page));
  const feed = await getPublicFeed({
    limit: 24,
    page,
    sort,
  });

  return (
    <div className="space-y-8 text-[#f4f5f7]">
      <header className="space-y-4">
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.45em] text-white/50">
            Feed
          </p>
          <h1 className="text-[clamp(2.1rem,4vw,3.2rem)] font-semibold text-white">
            Browse every public loadout
          </h1>
          <p className="text-sm text-white/70">
            Discover creator setups across every category, then switch to
            Following when you want updates only from your network.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/feed" variant="primary">
              All Posts
            </ButtonLink>
            <ButtonLink href="/feed/following" variant="secondary">
              Following
            </ButtonLink>
          </div>

          <div className="flex flex-wrap gap-2">
            {sortOptions.map((option) => {
              const isActive = option.value === sort;

              return (
                <Link
                  key={option.value}
                  href={buildFeedHref({ sort: option.value })}
                  className={`rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] transition ${
                    isActive
                      ? "border-[#d4dd7f]/70 bg-[#e6ef92] text-[#111111]"
                      : "border-white/[0.08] bg-[#171717] text-white/70 hover:border-white/[0.16] hover:text-white"
                  }`}
                >
                  {option.label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {feed.items.length === 0 ? (
        <div className="rounded-3xl border border-white/[0.05] bg-[#171717] p-7">
          <p className="text-sm text-white/70">
            No public loadouts are available yet. Publish a loadout from Studio
            or come back once creators start sharing more setups.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/48">
              {feed.totalCount} public posts
            </p>
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/40">
              Sorted by {sort === "recent" ? "recent" : sort}
            </p>
          </div>

          <FeedLoadoutGrid items={feed.items} />

          {feed.hasMore ? (
            <div className="flex justify-center">
              <ButtonLink
                href={buildFeedHref({ page: feed.page + 1, sort })}
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
