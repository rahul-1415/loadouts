"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Button from "./Button";

export default function EmailAuthForm() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const result = await signIn("email", {
        email,
        redirect: false,
        callbackUrl: "/",
      });

      if (result?.error) {
        setMessage("Unable to send sign-in link. Check your email settings.");
      } else {
        setMessage("Check your email for a sign-in link.");
        setEmail("");
      }
    } catch (error) {
      setMessage("Unable to send sign-in link. Check your email settings.");
    }

    setIsSubmitting(false);
  };

  return (
    <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
      <div>
        <label className="text-xs uppercase tracking-[0.3em] text-ink/50">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="mt-2 w-full rounded-xl border border-ink/20 bg-transparent px-3 py-2 text-sm text-ink placeholder:text-ink/40"
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Sending link" : "Continue with email"}
      </Button>
      {message && (
        <p className="text-xs uppercase tracking-[0.25em] text-ink/50">
          {message}
        </p>
      )}
    </form>
  );
}
