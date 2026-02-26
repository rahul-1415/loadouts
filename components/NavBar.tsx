"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { ButtonLink } from "./Button";
import { createSupabaseBrowserClient } from "../lib/supabase/browser";
import BrandLogo from "./BrandLogo";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Feed", href: "/feed" },
  { label: "Categories", href: "/categories" },
  { label: "My Loadouts", href: "/saved" },
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
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<NavProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

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

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = query.trim();
    const target = trimmed
      ? `/search?q=${encodeURIComponent(trimmed)}`
      : "/search";
    router.push(target);
  };

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0d0f13]/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-10 2xl:max-w-[1400px] 2xl:px-16">
        <Link className="inline-flex shrink-0 items-center" href="/" aria-label="Loadouts">
          <BrandLogo variant="lockup" size="sm" priority ariaLabel="Loadouts" />
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
          <form
            className="w-full max-w-[180px] sm:max-w-xs"
            onSubmit={handleSearchSubmit}
          >
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-[#171b24] px-3 py-2 text-[11px] uppercase tracking-[0.3em] text-white/50">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search"
                className="w-full bg-transparent text-[11px] uppercase tracking-[0.25em] text-white placeholder:text-white/40 focus:outline-none"
                aria-label="Search loadouts, products, and profiles"
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
              <button
                type="submit"
                className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-white/62"
              >
                Go
              </button>
            </div>
          </form>
          <div className="flex items-center gap-2">
            {isAuthLoading ? (
              <div className="h-10 w-36 animate-pulse rounded-full bg-white/10" />
            ) : user ? (
              <>
                <ButtonLink
                  href="/notifications"
                  variant="secondary"
                  className="px-4 py-2 text-[10px]"
                >
                  Alerts
                </ButtonLink>
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
