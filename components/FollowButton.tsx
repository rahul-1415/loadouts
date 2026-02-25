"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "./Button";

interface FollowButtonProps {
  targetHandle: string;
  initialFollowing: boolean;
  canFollow: boolean;
  compact?: boolean;
  refreshOnChange?: boolean;
}

interface FollowApiPayload {
  error?: {
    code?: string;
    message?: string;
  };
}

export default function FollowButton({
  targetHandle,
  initialFollowing,
  canFollow,
  compact = false,
  refreshOnChange = false,
}: FollowButtonProps) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!canFollow) {
    return null;
  }

  const handleToggle = async () => {
    setIsSubmitting(true);
    setMessage(null);

    const response = await fetch(
      following ? `/api/follows/${targetHandle}` : "/api/follows",
      {
        method: following ? "DELETE" : "POST",
        headers:
          following
            ? undefined
            : {
                "Content-Type": "application/json",
              },
        body: following ? undefined : JSON.stringify({ targetHandle }),
      }
    );

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | FollowApiPayload
        | null;

      if (payload?.error?.code === "PROFILE_INCOMPLETE") {
        router.push("/onboarding/profile");
        router.refresh();
        return;
      }

      setMessage(payload?.error?.message ?? "Unable to update follow status.");
      setIsSubmitting(false);
      return;
    }

    setFollowing((current) => !current);
    setIsSubmitting(false);

    if (refreshOnChange) {
      router.refresh();
    }
  };

  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      <Button
        type="button"
        variant={following ? "secondary" : "primary"}
        className={compact ? "px-3 py-1.5 text-[10px]" : "px-4 py-2 text-[10px]"}
        onClick={handleToggle}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Working" : following ? "Following" : "Follow"}
      </Button>
      {message ? (
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">
          {message}
        </p>
      ) : null}
    </div>
  );
}
