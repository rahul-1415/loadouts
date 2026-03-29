import Link from "next/link";
import type { FeedItem } from "../lib/data/feed";

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

interface FeedLoadoutGridProps {
  items: FeedItem[];
}

export default function FeedLoadoutGrid({ items }: FeedLoadoutGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/loadouts/${item.slug}`}
          className="overflow-hidden rounded-3xl border border-white/[0.04] bg-[#171717] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_18px_36px_rgba(0,0,0,0.16)] transition hover:border-white/[0.14]"
        >
          <div className={item.coverImageUrl ? "h-40 w-full" : "h-40 w-full bg-[#111111]"}>
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
                {formatDate(item.publishedAt ?? item.createdAt)}
              </span>
            </div>
            <h2 className="text-lg font-semibold text-white">{item.title}</h2>
            <p className="text-sm text-white/70">{item.description}</p>
            <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.25em] text-white/48">
              <span className="rounded-full border border-white/[0.08] bg-[#111111] px-3 py-1">
                {item.likeCount} likes
              </span>
              <span className="rounded-full border border-white/[0.08] bg-[#111111] px-3 py-1">
                {item.commentCount} comments
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
