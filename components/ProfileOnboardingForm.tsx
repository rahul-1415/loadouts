"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import Button from "./Button";

interface ProfileOnboardingFormProps {
  nextPath: string;
  initialUsername?: string;
  initialDisplayName?: string;
}

interface ApiPayload {
  error?: {
    code?: string;
    message?: string;
  };
}

export default function ProfileOnboardingForm({
  nextPath,
  initialUsername = "",
  initialDisplayName = "",
}: ProfileOnboardingFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState(initialUsername);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    const availabilityResponse = await fetch("/api/auth/username-available", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username }),
    });

    const availabilityPayload = (await availabilityResponse
      .json()
      .catch(() => null)) as
      | {
          available?: boolean;
          message?: string;
          normalizedUsername?: string;
        }
      | ApiPayload
      | null;

    if (!availabilityResponse.ok) {
      const availabilityMessage =
        availabilityPayload && "error" in availabilityPayload
          ? availabilityPayload.error?.message
          : (availabilityPayload as { message?: string } | null)?.message;

      setMessage(
        availabilityMessage ?? "Username check failed."
      );
      setIsSubmitting(false);
      return;
    }

    if (!(availabilityPayload as { available?: boolean })?.available) {
      setMessage(
        (availabilityPayload as { message?: string })?.message ??
          "This username is not available."
      );
      setIsSubmitting(false);
      return;
    }

    const response = await fetch("/api/profile/setup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username:
          (availabilityPayload as { normalizedUsername?: string })
            ?.normalizedUsername ?? username,
        displayName,
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | ApiPayload
      | null;

    if (!response.ok) {
      setMessage(payload?.error?.message ?? "Unable to complete setup.");
      setIsSubmitting(false);
      return;
    }

    router.replace(nextPath);
    router.refresh();
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="text-xs uppercase tracking-[0.3em] text-white/50">
          Username
        </label>
        <input
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="yourname"
          className="mt-2 w-full rounded-xl border border-white/20 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40"
          required
        />
        <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-white/45">
          3-30 chars, lowercase letters, numbers, underscore.
        </p>
      </div>

      <div>
        <label className="text-xs uppercase tracking-[0.3em] text-white/50">
          Display name
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="Your name"
          className="mt-2 w-full rounded-xl border border-white/20 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40"
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saving" : "Continue"}
      </Button>

      {message ? (
        <p className="text-xs uppercase tracking-[0.25em] text-white/60">
          {message}
        </p>
      ) : null}
    </form>
  );
}
