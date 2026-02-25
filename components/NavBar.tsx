"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { ButtonLink } from "./Button";
import { createSupabaseBrowserClient } from "../lib/supabase/browser";

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

interface NavProfile {
  id: string;
  handle: string | null;
  display_name: string | null;
}

export default function NavBar() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<NavProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];

    return searchSuggestions.filter((item) =>
      `${item.label} ${item.hint}`.toLowerCase().includes(term)
    );
  }, [query]);

  const showResults = isOpen && query.trim().length > 0;
  const displayName = useMemo(() => {
    if (!user && !profile) {
      return "";
    }

    if (profile?.display_name) {
      return profile.display_name;
    }

    if (profile?.handle) {
      return `@${profile.handle}`;
    }

    if (!user) {
      return "Profile";
    }

    const metadataName =
      (typeof user.user_metadata?.name === "string" &&
        user.user_metadata.name.trim()) ||
      (typeof user.user_metadata?.full_name === "string" &&
        user.user_metadata.full_name.trim());

    if (metadataName) {
      return metadataName;
    }

    if (user.email) {
      return user.email.split("@")[0] ?? "Profile";
    }

    return "Profile";
  }, [profile, user]);

  const profileHref = useMemo(() => {
    if (profile?.handle) {
      return `/profile/${profile.handle}`;
    }

    return "/profile";
  }, [profile?.handle]);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async (userId: string) => {
      const { data } = await supabase
        .from("profiles")
        .select("id,handle,display_name")
        .eq("id", userId)
        .limit(1)
        .maybeSingle();

      if (isMounted) {
        setProfile((data ?? null) as NavProfile | null);
      }
    };

    const loadUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (isMounted) {
        setUser(currentUser ?? null);
        if (currentUser) {
          void loadProfile(currentUser.id);
        } else {
          setProfile(null);
        }
        setIsAuthLoading(false);
      }
    };

    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        void loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setIsAuthLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, supabase.auth]);

  const handleSignOut = async () => {
    setIsSigningOut(true);

    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    router.push("/login");
    router.refresh();

    setIsSigningOut(false);
  };

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0d0f13]/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-10 2xl:max-w-[1400px] 2xl:px-16">
        <Link
          className="text-xs font-semibold uppercase tracking-[0.45em] text-white"
          href="/"
        >
          Loadouts
        </Link>
        <nav className="flex flex-wrap items-center gap-6 text-[11px] font-semibold uppercase tracking-[0.35em] text-white/58">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              className="transition hover:text-white"
              href={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-1 items-center justify-end gap-3">
          <div className="relative w-full max-w-[180px] sm:max-w-xs">
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-[#171b24] px-3 py-2 text-[11px] uppercase tracking-[0.3em] text-white/50">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => setIsOpen(true)}
                onBlur={() => setTimeout(() => setIsOpen(false), 120)}
                placeholder="Search"
                className="w-full bg-transparent text-[11px] uppercase tracking-[0.25em] text-white placeholder:text-white/40 focus:outline-none"
                aria-label="Search categories"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-white/62"
                >
                  Clear
                </button>
              )}
            </div>
            {showResults && (
              <div
                className="absolute left-0 right-0 mt-2 rounded-2xl border border-white/15 bg-[#121621] p-3 shadow-[0_25px_50px_rgba(0,0,0,0.38)]"
                onMouseDown={(event) => event.preventDefault()}
              >
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/50">
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
                        className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.25em] text-white/75 transition hover:border-white/30"
                      >
                        <span>{item.label}</span>
                        <span className="text-[10px] text-white/42">
                          {item.hint}
                        </span>
                      </Link>
                    ))
                  ) : (
                    <p className="text-xs uppercase tracking-[0.25em] text-white/40">
                      No matches yet
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isAuthLoading ? (
              <div className="h-10 w-36 animate-pulse rounded-full bg-white/10" />
            ) : user ? (
              <>
                <ButtonLink href={profileHref} variant="secondary" className="px-4 py-2 text-[10px]">
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[9px] font-semibold uppercase">
                      {(displayName[0] ?? "P").toUpperCase()}
                    </span>
                    {displayName}
                  </span>
                </ButtonLink>
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="group relative inline-flex items-center justify-center overflow-hidden rounded-full border border-white/25 bg-transparent px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#f4f5f7] transition hover:border-white/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35 disabled:opacity-70"
                >
                  {isSigningOut ? "Working" : "Log out"}
                </button>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
