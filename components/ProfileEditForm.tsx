"use client";

import { useState, type FormEvent } from "react";
import Button from "./Button";

interface ProfileEditFormProps {
  initialDisplayName: string;
  initialBio: string;
  initialAvatarUrl: string;
  initialInterests: string[];
}

interface ApiPayload {
  error?: {
    message?: string;
  };
}

function parseInterests(value: string) {
  const list = value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 0)
    .slice(0, 10);

  return Array.from(new Set(list));
}

export default function ProfileEditForm({
  initialDisplayName,
  initialBio,
  initialAvatarUrl,
  initialInterests,
}: ProfileEditFormProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [interestsInput, setInterestsInput] = useState(
    initialInterests.join(", ")
  );
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        displayName,
        bio,
        avatarUrl,
        interests: parseInterests(interestsInput),
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | ApiPayload
      | null;

    if (!response.ok) {
      setMessage(payload?.error?.message ?? "Unable to save profile.");
      setIsSubmitting(false);
      return;
    }

    setMessage("Profile updated.");
    setIsSubmitting(false);
  }

  return (
    <form
      className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-4"
      onSubmit={handleSubmit}
    >
      <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/65">
        Edit profile
      </h2>

      <div>
        <label className="text-[11px] uppercase tracking-[0.25em] text-white/55">
          Display name
        </label>
        <input
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          className="mt-2 w-full rounded-xl border border-white/20 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40"
          required
        />
      </div>

      <div>
        <label className="text-[11px] uppercase tracking-[0.25em] text-white/55">
          Bio
        </label>
        <textarea
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          rows={3}
          className="mt-2 w-full rounded-xl border border-white/20 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40"
          placeholder="Tell people what you build"
        />
      </div>

      <div>
        <label className="text-[11px] uppercase tracking-[0.25em] text-white/55">
          Avatar URL
        </label>
        <input
          value={avatarUrl}
          onChange={(event) => setAvatarUrl(event.target.value)}
          className="mt-2 w-full rounded-xl border border-white/20 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40"
          placeholder="https://..."
        />
      </div>

      <div>
        <label className="text-[11px] uppercase tracking-[0.25em] text-white/55">
          Interests (comma separated)
        </label>
        <input
          value={interestsInput}
          onChange={(event) => setInterestsInput(event.target.value)}
          className="mt-2 w-full rounded-xl border border-white/20 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40"
          placeholder="photography, ai-tools, productivity"
        />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving" : "Save profile"}
      </Button>

      {message ? (
        <p className="text-[11px] uppercase tracking-[0.2em] text-white/55">
          {message}
        </p>
      ) : null}
    </form>
  );
}
