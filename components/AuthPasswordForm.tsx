"use client";

import { useState } from "react";
import Button from "./Button";
import { supabase } from "../lib/supabaseClient";

interface AuthPasswordFormProps {
  mode: "login" | "signup";
}

export default function AuthPasswordForm({ mode }: AuthPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const action =
      mode === "signup"
        ? supabase.auth.signUp({ email, password })
        : supabase.auth.signInWithPassword({ email, password });

    const { error } = await action;

    if (error) {
      setMessage(error.message);
    } else {
      setMessage(
        mode === "signup"
          ? "Check your email to confirm your account."
          : "Signed in successfully."
      );
    }

    setIsSubmitting(false);
  };

  const handleReset = async () => {
    if (!email) {
      setMessage("Enter your email to reset your password.");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Password reset link sent.");
    }

    setIsSubmitting(false);
  };

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="text-xs uppercase tracking-[0.3em] text-ink/50">
          Email
        </label>
        <input
          type="email"
          placeholder="you@example.com"
          className="mt-2 w-full rounded-xl border border-ink/20 bg-transparent px-3 py-2 text-sm text-ink placeholder:text-ink/40"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      <div>
        <label className="text-xs uppercase tracking-[0.3em] text-ink/50">
          Password
        </label>
        <input
          type="password"
          placeholder="••••••••"
          className="mt-2 w-full rounded-xl border border-ink/20 bg-transparent px-3 py-2 text-sm text-ink placeholder:text-ink/40"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        {mode === "login" && (
          <div className="mt-2 text-right">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs uppercase tracking-[0.3em] text-ink/60 underline"
            >
              Forgot password
            </button>
          </div>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting
          ? "Working"
          : mode === "signup"
            ? "Create account"
            : "Sign in"}
      </Button>
      {message && (
        <p className="text-xs uppercase tracking-[0.25em] text-ink/50">
          {message}
        </p>
      )}
    </form>
  );
}
