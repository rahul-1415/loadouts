"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Button from "./Button";

interface ReportButtonProps {
  entityType: "loadout" | "profile" | "comment";
  entityId: string;
}

export default function ReportButton({ entityType, entityId }: ReportButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setIsSubmitting(true);
    setMessage(null);

    const response = await fetch("/api/reports", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ entityType, entityId, reason }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { error?: { code?: string; message?: string } }
      | null;

    if (!response.ok) {
      if (payload?.error?.code === "UNAUTHORIZED") {
        router.push(`/login?next=${encodeURIComponent(pathname || "/")}`);
        setIsSubmitting(false);
        return;
      }

      if (payload?.error?.code === "PROFILE_INCOMPLETE") {
        router.push(
          `/onboarding/profile?next=${encodeURIComponent(pathname || "/")}`
        );
        setIsSubmitting(false);
        return;
      }

      setMessage(payload?.error?.message ?? "Unable to submit report.");
      setIsSubmitting(false);
      return;
    }

    setMessage("Report submitted.");
    setReason("");
    setIsSubmitting(false);
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="secondary" className="px-4 py-2 text-[10px]" onClick={() => setIsOpen((current) => !current)}>
        Report
      </Button>
      {isOpen ? (
        <div className="w-full max-w-sm space-y-2 rounded-2xl border border-white/[0.08] bg-[#171717] p-3">
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            placeholder="Describe the issue"
            className="w-full rounded-xl border border-white/[0.08] bg-[#181818] px-3 py-2 text-sm text-white placeholder:text-white/40"
          />
          <div className="flex items-center gap-3">
            <Button type="button" onClick={handleSubmit} disabled={isSubmitting || reason.trim().length < 8}>
              {isSubmitting ? "Sending" : "Send Report"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </div>
          {message ? <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">{message}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
