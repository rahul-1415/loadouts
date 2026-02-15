"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "../lib/supabase/browser";

interface SignOutButtonProps {
  className?: string;
}

export default function SignOutButton({ className = "" }: SignOutButtonProps) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);

    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();

    setIsSigningOut(false);
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isSigningOut}
      className={`group relative inline-flex items-center justify-center overflow-hidden rounded-full border border-white/25 bg-transparent px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#f4f5f7] transition hover:border-white/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35 disabled:opacity-70 ${className}`}
    >
      {isSigningOut ? "Working" : "Log out"}
    </button>
  );
}
