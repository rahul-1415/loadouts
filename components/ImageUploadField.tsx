"use client";

import { useId, useRef, useState } from "react";
import Button from "./Button";
import type { UploadKind } from "../lib/uploads";

interface ImageUploadFieldProps {
  label: string;
  kind: UploadKind;
  value: string;
  onChange: (nextValue: string) => void;
  helpText?: string;
}

export default function ImageUploadField({
  label,
  kind,
  value,
  onChange,
  helpText,
}: ImageUploadFieldProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", kind);

    const response = await fetch("/api/uploads", {
      method: "POST",
      body: formData,
    });

    const payload = (await response.json().catch(() => null)) as
      | { data?: { publicUrl?: string }; error?: { message?: string } }
      | null;

    if (!response.ok || !payload?.data?.publicUrl) {
      setMessage(payload?.error?.message ?? "Unable to upload image.");
      setIsUploading(false);
      return;
    }

    onChange(payload.data.publicUrl);
    setMessage("Upload complete.");
    setIsUploading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-white/[0.04] bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <label htmlFor={inputId} className="text-[11px] uppercase tracking-[0.25em] text-white/55">
            {label}
          </label>
          {helpText ? <p className="mt-1 text-xs text-white/50">{helpText}</p> : null}
        </div>
        <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
          {isUploading ? "Uploading..." : "Upload"}
        </Button>
      </div>

      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {value ? (
        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111111]">
          <img src={value} alt={label} className="h-40 w-full object-cover" />
        </div>
      ) : (
        <div className="grid h-32 place-items-center rounded-2xl border border-dashed border-white/[0.08] bg-[#111111] text-xs uppercase tracking-[0.2em] text-white/40">
          No image uploaded
        </div>
      )}

      {message ? <p className="text-xs uppercase tracking-[0.2em] text-white/55">{message}</p> : null}
    </div>
  );
}
