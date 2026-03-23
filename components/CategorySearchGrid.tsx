"use client";

import { useMemo, useState } from "react";
import CollectionCard from "./CollectionCard";

interface CategoryCardItem {
  id: string;
  title: string;
  author?: string;
  description?: string;
  coverImageUrl?: string | null;
}

interface CategorySearchGridProps {
  categories: CategoryCardItem[];
}

function normalizeQuery(value: string) {
  return value.trim().toLowerCase();
}

export default function CategorySearchGrid({
  categories,
}: CategorySearchGridProps) {
  const [query, setQuery] = useState("");

  const filteredCategories = useMemo(() => {
    const normalizedQuery = normalizeQuery(query);

    if (!normalizedQuery) {
      return categories;
    }

    return categories.filter((category) => {
      const haystack = [category.title, category.id]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [categories, query]);

  const hasQuery = normalizeQuery(query).length > 0;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-[clamp(1.6rem,3vw,2.4rem)] font-semibold text-ink">
            All Categories
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-ink/70">
            100 categories from A to Z covering audio, PC builds, kitchen
            tech, photography, and more.
          </p>
          {hasQuery ? (
            <p className="mt-3 text-[11px] uppercase tracking-[0.25em] text-ink/50">
              {filteredCategories.length} result
              {filteredCategories.length === 1 ? "" : "s"} for "{query.trim()}"
            </p>
          ) : null}
        </div>
        <div className="w-full max-w-xs">
          <div className="flex items-center gap-2 rounded-full border border-ink/20 bg-paper px-3 py-2 text-[11px] uppercase tracking-[0.3em] text-ink/50">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              className="w-full bg-transparent text-[11px] uppercase tracking-[0.25em] text-ink placeholder:text-ink/40 focus:outline-none"
              aria-label="Search categories"
            />
            {hasQuery ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="shrink-0 text-[10px] uppercase tracking-[0.25em] text-ink/55 transition hover:text-ink"
                aria-label="Clear category search"
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {filteredCategories.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {filteredCategories.map((category) => (
            <CollectionCard key={category.id} {...category} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-white/[0.04] bg-[#171717] px-5 py-8 text-sm text-white/70">
          No categories match "{query.trim()}". Try a broader keyword.
        </div>
      )}
    </section>
  );
}
