"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Button from "./Button";
import ImageUploadField from "./ImageUploadField";

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
  const router = useRouter();
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
    router.refresh();
  }

  return (
    <form
      className="space-y-4 rounded-2xl border border-white/[0.04] bg-[#171717] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
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
          className="mt-2 w-full rounded-xl border border-white/[0.08] bg-[#181818] px-3 py-2 text-sm text-white placeholder:text-white/40"
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
          className="mt-2 w-full rounded-xl border border-white/[0.08] bg-[#181818] px-3 py-2 text-sm text-white placeholder:text-white/40"
          placeholder="Tell people what you build"
        />
      </div>

      <ImageUploadField
        label="Avatar"
        kind="avatar"
        value={avatarUrl}
        onChange={setAvatarUrl}
        helpText="Upload a profile image for your public creator page."
      />

      <div>
        <label className="text-[11px] uppercase tracking-[0.25em] text-white/55">
          Interests (comma separated)
        </label>
        <input
          value={interestsInput}
          onChange={(event) => setInterestsInput(event.target.value)}
          className="mt-2 w-full rounded-xl border border-white/[0.08] bg-[#181818] px-3 py-2 text-sm text-white placeholder:text-white/40"
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
