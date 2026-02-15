"use client";

import { useMemo, useState } from "react";
import Button from "./Button";
import { createSupabaseBrowserClient } from "../lib/supabase/browser";

type OAuthProvider = "github" | "google";

interface AuthOAuthButtonsProps {
  nextPath: string;
}

function GitHubIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="currentColor"
    >
      <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.52 2.87 8.36 6.84 9.71.5.09.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.38-3.37-1.38-.45-1.2-1.11-1.52-1.11-1.52-.91-.64.07-.63.07-.63 1 .07 1.52 1.07 1.52 1.07.9 1.58 2.36 1.12 2.94.85.09-.68.35-1.12.63-1.38-2.22-.26-4.56-1.15-4.56-5.1 0-1.13.39-2.05 1.03-2.77-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.05a9.2 9.2 0 0 1 2.5-.35c.85 0 1.71.12 2.5.35 1.9-1.33 2.74-1.05 2.74-1.05.56 1.4.21 2.44.1 2.7.64.72 1.03 1.64 1.03 2.77 0 3.96-2.35 4.84-4.58 5.1.36.32.68.95.68 1.92 0 1.38-.01 2.49-.01 2.83 0 .27.18.59.69.49A10.02 10.02 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
      <path
        d="M21.6 12.23c0-.72-.06-1.25-.19-1.8H12v3.26h5.6c-.11.85-.72 2.13-2.07 2.99l-.02.11 2.97 2.32.21.02c1.95-1.83 3.1-4.52 3.1-7.9Z"
        fill="currentColor"
      />
      <path
        d="M12 22c2.7 0 4.97-.9 6.63-2.45l-3.16-2.45c-.85.61-1.98 1.03-3.47 1.03-2.65 0-4.9-1.83-5.7-4.36l-.1.01-3.07 2.4-.04.1A10.03 10.03 0 0 0 12 22Z"
        fill="currentColor"
      />
      <path
        d="M6.3 13.77a6.23 6.23 0 0 1 0-3.54l-.01-.12-3.11-2.44-.1.05a10.3 10.3 0 0 0 0 9.6l3.22-2.55Z"
        fill="currentColor"
      />
      <path
        d="M12 6.87c1.62 0 2.71.72 3.34 1.33l2.44-2.43C16.96 4.9 14.7 4 12 4A10.03 10.03 0 0 0 3.08 7.73l3.22 2.55C7.1 8.7 9.35 6.87 12 6.87Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function AuthOAuthButtons({ nextPath }: AuthOAuthButtonsProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingProvider, setPendingProvider] = useState<OAuthProvider | null>(
    null
  );

  const handleOAuthSignIn = async (provider: OAuthProvider) => {
    setPendingProvider(provider);
    setMessage(null);

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.trim() || window.location.origin;
    const callbackUrl = new URL("/auth/callback", siteUrl);

    callbackUrl.searchParams.set("next", nextPath);

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });

    if (error) {
      setMessage(error.message);
      setPendingProvider(null);
    }
  };

  return (
    <>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="secondary"
          className="h-12 w-full"
          aria-label="Continue with GitHub"
          onClick={() => handleOAuthSignIn("github")}
          disabled={pendingProvider !== null}
        >
          <GitHubIcon />
          <span className="sr-only">Continue with GitHub</span>
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="h-12 w-full"
          aria-label="Continue with Google"
          onClick={() => handleOAuthSignIn("google")}
          disabled={pendingProvider !== null}
        >
          <GoogleIcon />
          <span className="sr-only">Continue with Google</span>
        </Button>
      </div>
      {message && (
        <p className="mt-3 text-xs uppercase tracking-[0.25em] text-ink/50">
          {message}
        </p>
      )}
    </>
  );
}
