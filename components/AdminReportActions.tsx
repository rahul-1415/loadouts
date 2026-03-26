"use client";

import { useState } from "react";
import Button from "./Button";

export default function AdminReportActions({ reportId, initialStatus }: { reportId: string; initialStatus: string }) {
  const [status, setStatus] = useState(initialStatus);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function updateStatus(nextStatus: string) {
    setBusy(true);
    setMessage(null);

    const response = await fetch(`/api/reports/${reportId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: nextStatus }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;

    if (!response.ok) {
      setMessage(payload?.error?.message ?? "Unable to update report.");
      setBusy(false);
      return;
    }

    setStatus(nextStatus);
    setMessage("Updated");
    setBusy(false);
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-[0.22em] text-white/45">{status}</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" className="px-3 py-1.5 text-[10px]" disabled={busy} onClick={() => updateStatus("reviewed")}>
          Review
        </Button>
        <Button type="button" variant="secondary" className="px-3 py-1.5 text-[10px]" disabled={busy} onClick={() => updateStatus("dismissed")}>
          Dismiss
        </Button>
        <Button type="button" className="px-3 py-1.5 text-[10px]" disabled={busy} onClick={() => updateStatus("resolved")}>
          Resolve
        </Button>
      </div>
      {message ? <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">{message}</p> : null}
    </div>
  );
}
