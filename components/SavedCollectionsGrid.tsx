"use client";

import Link from "next/link";
import { useState } from "react";
import type { SavedCollectionListItem } from "../lib/data/collections";
import { ButtonLink } from "./Button";
import SaveButton from "./SaveButton";

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

export default function SavedCollectionsGrid({
  initialItems,
  viewerUserId,
}: {
  initialItems: SavedCollectionListItem[];
  viewerUserId: string | null;
}) {
  const [items, setItems] = useState(initialItems);

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-white/[0.04] bg-[#171717] p-8 text-center">
        <p className="text-[11px] uppercase tracking-[0.35em] text-white/55">
          Saved Cleared
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          You removed the last saved item
        </h2>
        <p className="mt-2 text-sm text-white/70">
          Jump back into discovery and save more loadouts or category references
          when you find something worth revisiting.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/feed">Browse Feed</ButtonLink>
          <ButtonLink href="/categories" variant="secondary">
            Explore Categories
          </ButtonLink>
          <ButtonLink href="/studio" variant="secondary">
            Open Studio
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {items.map((item) => {
        const href = `/${item.kind === "loadout" ? "loadouts" : "categories"}/${item.slug}`;

        return (
          <article
            key={item.id}
            className="overflow-hidden rounded-3xl border border-white/[0.04] bg-[#171717] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_18px_36px_rgba(0,0,0,0.16)]"
          >
            <Link href={href} className="block">
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
            </Link>

            <div className="space-y-4 p-5">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/[0.08] px-2.5 py-1 text-[10px] uppercase tracking-[0.23em] text-white/75">
                    {item.kind}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-white/45">
                    Saved {formatDate(item.savedAt)}
                  </span>
                </div>

                <Link href={href} className="block">
                  <h2 className="text-lg font-semibold text-white transition hover:text-[#e6ef92]">
                    {item.title}
                  </h2>
                </Link>

                <p className="text-[11px] uppercase tracking-[0.25em] text-white/50">
                  {item.author}
                </p>

                <p className="text-sm text-white/70">
                  {item.description || "No description added yet."}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <ButtonLink
                  href={href}
                  variant="secondary"
                  className="px-4 py-2 text-[10px]"
                >
                  Open
                </ButtonLink>
                <SaveButton
                  collectionId={item.id}
                  collectionSlug={item.slug}
                  initialSaved
                  viewerUserId={viewerUserId}
                  compact
                  onToggle={(saved) => {
                    if (!saved) {
                      setItems((current) =>
                        current.filter((currentItem) => currentItem.id !== item.id)
                      );
                    }
                  }}
                />
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
