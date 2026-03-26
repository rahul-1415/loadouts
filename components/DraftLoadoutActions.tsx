"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "./Button";

interface DraftLoadoutActionsProps {
  loadoutSlug: string;
  title: string;
  description: string;
  categoryId: string | null;
  coverImageUrl: string | null;
}

interface ApiErrorPayload {
  error?: {
    message?: string;
  };
}

export default function DraftLoadoutActions({
  loadoutSlug,
  title,
  description,
  categoryId,
  coverImageUrl,
}: DraftLoadoutActionsProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handlePublish() {
    setIsSubmitting(true);
    setMessage(null);
    setErrorMessage(null);

    const response = await fetch(`/api/collections/${encodeURIComponent(loadoutSlug)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        description,
        categoryId,
        coverImageUrl,
        status: "published",
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;
      setErrorMessage(payload?.error?.message ?? "Unable to create loadout.");
      setIsSubmitting(false);
      return;
    }

    setMessage("Loadout published.");
    setIsSubmitting(false);
    router.refresh();
  }

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/studio");
  }

  return (
    <div className="space-y-3 rounded-3xl border border-white/[0.05] bg-[#171717] p-5">
      <p className="text-[11px] uppercase tracking-[0.35em] text-white/50">
        Draft Actions
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="secondary" onClick={handleBack}>
          Back
        </Button>
        <Button type="button" onClick={handlePublish} disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Loadout"}
        </Button>
      </div>
      {message ? <p className="text-sm text-[#86efac]">{message}</p> : null}
      {errorMessage ? <p className="text-sm text-[#fda4a4]">{errorMessage}</p> : null}
    </div>
  );
}
