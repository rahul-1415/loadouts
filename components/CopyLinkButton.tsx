"use client";

import { useState } from "react";
import Button from "./Button";

export default function CopyLinkButton({ path }: { path: string }) {
  const [message, setMessage] = useState<string | null>(null);

  async function handleCopy() {
    const target = typeof window === "undefined" ? path : new URL(path, window.location.origin).toString();

    try {
      await navigator.clipboard.writeText(target);
      setMessage("Copied");
      window.setTimeout(() => setMessage(null), 1500);
    } catch {
      setMessage("Copy failed");
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="secondary" className="px-4 py-2 text-[10px]" onClick={handleCopy}>
        Share
      </Button>
      {message ? <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">{message}</p> : null}
    </div>
  );
}
