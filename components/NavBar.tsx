"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ButtonLink } from "./Button";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Categories", href: "/categories" },
  { label: "My Loadouts", href: "/saved" },
];

const searchSuggestions = [
  { label: "{{CATEGORY_NAME}}", hint: "Creator gear" },
  { label: "{{CATEGORY_NAME}}", hint: "Studio setups" },
  { label: "{{CATEGORY_NAME}}", hint: "Mobile rigs" },
  { label: "{{CATEGORY_NAME}}", hint: "Audio stacks" },
];

export default function NavBar() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];

    return searchSuggestions.filter((item) =>
      `${item.label} ${item.hint}`.toLowerCase().includes(term)
    );
  }, [query]);

  const showResults = isOpen && query.trim().length > 0;

  return (
    <header className="sticky top-0 z-20 border-b border-ink/10 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-10 2xl:max-w-[1400px] 2xl:px-16">
        <Link
          className="text-xs font-semibold uppercase tracking-[0.45em] text-ink"
          href="/"
        >
          Loadouts
        </Link>
        <nav className="flex flex-wrap items-center gap-6 text-[11px] font-semibold uppercase tracking-[0.35em] text-ink/60">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              className="transition hover:text-ink"
              href={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-1 items-center justify-end gap-3">
          <div className="relative w-full max-w-[180px] sm:max-w-xs">
            <div className="flex items-center gap-2 rounded-full border border-ink/20 bg-paper px-3 py-2 text-[11px] uppercase tracking-[0.3em] text-ink/50">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => setIsOpen(true)}
                onBlur={() => setTimeout(() => setIsOpen(false), 120)}
                placeholder="Search"
                className="w-full bg-transparent text-[11px] uppercase tracking-[0.25em] text-ink placeholder:text-ink/40 focus:outline-none"
                aria-label="Search categories"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="rounded-full border border-ink/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-ink/60"
                >
                  Clear
                </button>
              )}
            </div>
            {showResults && (
              <div
                className="absolute left-0 right-0 mt-2 rounded-2xl border border-ink/15 bg-paper p-3 shadow-[0_25px_50px_rgba(27,29,38,0.12)]"
                onMouseDown={(event) => event.preventDefault()}
              >
                <p className="text-[10px] uppercase tracking-[0.3em] text-ink/50">
                  Suggested categories
                </p>
                <div className="mt-3 space-y-2">
                  {results.length > 0 ? (
                    results.map((item) => (
                      <Link
                        key={`${item.label}-${item.hint}`}
                        href={`/categories?query=${encodeURIComponent(
                          item.label
                        )}`}
                        className="flex items-center justify-between rounded-xl border border-ink/10 px-3 py-2 text-xs uppercase tracking-[0.25em] text-ink/70 transition hover:border-ink/30"
                      >
                        <span>{item.label}</span>
                        <span className="text-[10px] text-ink/40">
                          {item.hint}
                        </span>
                      </Link>
                    ))
                  ) : (
                    <p className="text-xs uppercase tracking-[0.25em] text-ink/40">
                      No matches yet
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ButtonLink
              href="/login"
              variant="secondary"
              className="px-4 py-2 text-[10px]"
            >
              Sign in
            </ButtonLink>
            <ButtonLink href="/signup" className="px-4 py-2 text-[10px]">
              Sign up
            </ButtonLink>
          </div>
        </div>
      </div>
    </header>
  );
}
