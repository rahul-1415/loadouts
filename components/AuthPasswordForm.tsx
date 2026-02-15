"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "./Button";
import { createSupabaseBrowserClient } from "../lib/supabase/browser";

interface AuthPasswordFormProps {
  mode: "login" | "signup";
  nextPath: string;
}

type SignupEmailStatus =
  | "unknown"
  | "new"
  | "confirmed_exists"
  | "unconfirmed_exists";

export default function AuthPasswordForm({
  mode,
  nextPath,
}: AuthPasswordFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [signupStep, setSignupStep] = useState<"email" | "password">("email");
  const [signupEmailStatus, setSignupEmailStatus] =
    useState<SignupEmailStatus>("unknown");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  const recoveryFromQuery =
    searchParams.get("mode") === "recovery" ||
    searchParams.get("type") === "recovery";

  useEffect(() => {
    setIsRecoveryMode(recoveryFromQuery);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecoveryMode(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [recoveryFromQuery, supabase.auth]);

  const sendSignupResendLink = async (emailValue: string, next: string) => {
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.trim() || window.location.origin;
    const confirmUrl = new URL("/auth/confirm", siteUrl);
    confirmUrl.searchParams.set("next", next);

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: emailValue,
      options: {
        emailRedirectTo: confirmUrl.toString(),
      },
    });

    if (error) {
      return error.message;
    }

    return null;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    if (mode === "signup" && signupStep === "email") {
      if (!email) {
        setMessage("Enter your email to continue.");
        setIsSubmitting(false);
        return;
      }

      try {
        const response = await fetch("/api/auth/email-exists", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          setMessage(
            payload?.error?.message ??
              "Unable to verify this email right now. Try again."
          );
          setIsSubmitting(false);
          return;
        }

        if (payload?.exists) {
          if (payload?.emailConfirmed) {
            setSignupEmailStatus("confirmed_exists");
            setMessage(
              "An account with this email already exists. Please sign in."
            );
            setIsSubmitting(false);
            return;
          }

          setSignupEmailStatus("unconfirmed_exists");
        } else {
          setSignupEmailStatus("new");
        }
      } catch {
        setMessage("Unable to verify this email right now. Try again.");
        setIsSubmitting(false);
        return;
      }

      setSignupStep("password");
      setIsSubmitting(false);
      return;
    }

    if (mode === "login" && isRecoveryMode) {
      if (!password) {
        setMessage("Enter a new password.");
        setIsSubmitting(false);
        return;
      }

      if (password !== confirmPassword) {
        setMessage("Passwords do not match.");
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setMessage(error.message);
      } else {
        router.replace("/login?reset=success");
        router.refresh();
      }

      setIsSubmitting(false);
      return;
    }

    if (mode === "signup") {
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL?.trim() || window.location.origin;
      const confirmUrl = new URL("/auth/confirm", siteUrl);
      confirmUrl.searchParams.set("next", nextPath);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: confirmUrl.toString(),
        },
      });

      if (error) {
        if (
          error.message.toLowerCase().includes("already") ||
          error.message.toLowerCase().includes("registered")
        ) {
          if (signupEmailStatus === "unconfirmed_exists") {
            const resendError = await sendSignupResendLink(email, nextPath);

            setMessage(
              resendError
                ? resendError
                : "Check your email to confirm your account."
            );
          } else {
            setMessage(
              "An account with this email already exists. Please sign in."
            );
          }
          setSignupStep("email");
          setPassword("");
          setSignupEmailStatus("unknown");
        } else {
          setMessage(error.message);
        }
      } else {
        const identities = data.user?.identities ?? [];

        if (identities.length === 0) {
          if (signupEmailStatus === "unconfirmed_exists") {
            const resendError = await sendSignupResendLink(email, nextPath);

            setMessage(
              resendError
                ? resendError
                : "Check your email to confirm your account."
            );
          } else {
            setMessage(
              "An account with this email already exists. Please sign in."
            );
          }
          setSignupStep("email");
          setPassword("");
          setSignupEmailStatus("unknown");
        } else {
          setMessage("Check your email to confirm your account.");
          setSignupStep("email");
          setPassword("");
          setSignupEmailStatus("unknown");
        }
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
      } else {
        router.replace(nextPath);
        router.refresh();
      }
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

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.trim() || window.location.origin;
    const recoveryUrl = new URL("/login", siteUrl);
    recoveryUrl.searchParams.set("mode", "recovery");
    recoveryUrl.searchParams.set("next", nextPath);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: recoveryUrl.toString(),
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
      {mode === "signup" ? (
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
            disabled={signupStep === "password"}
            required
          />
          {signupStep === "password" && (
            <div className="mt-2 text-right">
              <button
                type="button"
                onClick={() => {
                  setSignupStep("email");
                  setPassword("");
                  setMessage(null);
                  setSignupEmailStatus("unknown");
                }}
                className="text-xs uppercase tracking-[0.3em] text-ink/60 underline"
              >
                Back
              </button>
            </div>
          )}
        </div>
      ) : mode === "login" && isRecoveryMode ? (
        <p className="text-xs uppercase tracking-[0.3em] text-ink/55">
          Enter and confirm a new password for your account.
        </p>
      ) : (
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
      )}
      {(mode === "login" || (mode === "signup" && signupStep === "password")) && (
        <div>
          <label className="text-xs uppercase tracking-[0.3em] text-ink/50">
            {mode === "login" && isRecoveryMode ? "New password" : "Password"}
          </label>
          <input
            type="password"
            placeholder="••••••••"
            className="mt-2 w-full rounded-xl border border-ink/20 bg-transparent px-3 py-2 text-sm text-ink placeholder:text-ink/40"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {mode === "login" && !isRecoveryMode && (
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
      )}
      {mode === "login" && isRecoveryMode && (
        <div>
          <label className="text-xs uppercase tracking-[0.3em] text-ink/50">
            Confirm new password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            className="mt-2 w-full rounded-xl border border-ink/20 bg-transparent px-3 py-2 text-sm text-ink placeholder:text-ink/40"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
        </div>
      )}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting
          ? "Working"
          : mode === "login" && isRecoveryMode
            ? "Update password"
            : mode === "signup" && signupStep === "email"
              ? "Continue"
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
