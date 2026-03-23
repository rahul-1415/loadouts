"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import Button from "./Button";

interface ApiErrorPayload {
  error?: {
    code?: string;
    message?: string;
  };
}

interface SaveButtonProps {
  collectionId?: string;
  collectionSlug?: string;
  initialSaved: boolean;
  initialSaveCount?: number;
  viewerUserId: string | null;
  compact?: boolean;
  onToggle?: (saved: boolean) => void;
}

export default function SaveButton({
  collectionId,
  collectionSlug,
  initialSaved,
  initialSaveCount,
  viewerUserId,
  compact = false,
  onToggle,
}: SaveButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [saveCount, setSaveCount] = useState(initialSaveCount ?? 0);
  const [isPending, setIsPending] = useState(false);

  const nextPath = pathname || (collectionSlug ? `/loadouts/${collectionSlug}` : "/saved");

  const redirectToLogin = () => {
    router.push(`/login?next=${encodeURIComponent(nextPath)}`);
  };

  const redirectToOnboarding = () => {
    router.push(`/onboarding/profile?next=${encodeURIComponent(nextPath)}`);
  };

  const handleClick = async () => {
    if (!viewerUserId) {
      redirectToLogin();
      return;
    }

    setIsPending(true);

    const response = await fetch("/api/saved", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        collectionId,
        collectionSlug,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | ApiErrorPayload
        | null;
      const code = payload?.error?.code;

      if (code === "UNAUTHORIZED") {
        setIsPending(false);
        redirectToLogin();
        return;
      }

      if (code === "PROFILE_INCOMPLETE") {
        setIsPending(false);
        redirectToOnboarding();
        return;
      }

      setIsPending(false);
      return;
    }

    const payload = (await response.json().catch(() => null)) as
      | {
          data?: {
            saved?: boolean;
            saveCount?: number;
          };
        }
      | null;

    const nextSaved = Boolean(payload?.data?.saved);

    setIsSaved(nextSaved);
    setSaveCount(payload?.data?.saveCount ?? saveCount);
    setIsPending(false);
    onToggle?.(nextSaved);
    router.refresh();
  };

  const label = initialSaveCount != null ? `${isSaved ? "Saved" : "Save"} (${saveCount})` : isSaved ? "Saved" : "Save";

  return (
    <Button
      type="button"
      variant={isSaved ? "primary" : "secondary"}
      onClick={handleClick}
      disabled={isPending}
      className={compact ? "px-4 py-2 text-[10px]" : ""}
    >
      {isPending ? "Working..." : label}
    </Button>
  );
}
