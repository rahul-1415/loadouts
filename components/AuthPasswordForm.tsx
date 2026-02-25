"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "./Button";
import { createSupabaseBrowserClient } from "../lib/supabase/browser";
import { getPasswordStrength } from "../lib/auth/passwordStrength";

interface AuthPasswordFormProps {
  mode: "login" | "signup";
  nextPath: string;
}

type SignupEmailStatus =
  | "unknown"
  | "new"
  | "confirmed_exists"
  | "unconfirmed_exists";

type SignupStep = "email" | "profile" | "password";

interface UsernameAvailabilityPayload {
  available?: boolean;
  normalizedUsername?: string;
  message?: string;
  error?: {
    message?: string;
  };
}

function strengthClasses(label: "weak" | "medium" | "strong") {
  if (label === "strong") {
    return "text-[#86efac]";
  }

  if (label === "medium") {
    return "text-[#fde68a]";
  }

  return "text-[#fca5a5]";
}

export default function AuthPasswordForm({
  mode,
  nextPath,
}: AuthPasswordFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [signupStep, setSignupStep] = useState<SignupStep>("email");
  const [signupEmailStatus, setSignupEmailStatus] =
    useState<SignupEmailStatus>("unknown");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  const recoveryFromQuery =
    searchParams.get("mode") === "recovery" ||
    searchParams.get("type") === "recovery";

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

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

  async function checkEmailBeforeSignup() {
    if (!email) {
      setMessage("Enter your email to continue.");
      return false;
    }

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
      return false;
    }

    if (payload?.exists) {
      if (payload?.emailConfirmed) {
        setSignupEmailStatus("confirmed_exists");
        setMessage("An account with this email already exists. Please sign in.");
        return false;
      }

      setSignupEmailStatus("unconfirmed_exists");
    } else {
      setSignupEmailStatus("new");
    }

    return true;
  }

  async function checkUsernameAvailability() {
    if (!username.trim()) {
      setMessage("Choose a username to continue.");
      return null;
    }

    if (!displayName.trim()) {
      setMessage("Enter a display name to continue.");
      return null;
    }

    const response = await fetch("/api/auth/username-available", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username }),
    });

    const payload = (await response.json().catch(() => null)) as
      | UsernameAvailabilityPayload
      | null;

    if (!response.ok) {
      setMessage(
        payload?.error?.message ?? payload?.message ?? "Username check failed."
      );
      return null;
    }

    if (!payload?.available) {
      setMessage(payload?.message ?? "This username is unavailable.");
      return null;
    }

    return payload?.normalizedUsername ?? username.trim().toLowerCase();
  }

  async function handleSignupSubmit() {
    if (!password) {
      setMessage("Enter a password.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.trim() || window.location.origin;
    const confirmUrl = new URL("/auth/confirm", siteUrl);
    confirmUrl.searchParams.set("next", nextPath);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: confirmUrl.toString(),
        data: {
          pending_handle: username.trim().toLowerCase(),
          pending_display_name: displayName.trim(),
        },
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
          setMessage("An account with this email already exists. Please sign in.");
        }
      } else {
        setMessage(error.message);
      }

      setSignupStep("email");
      setPassword("");
      setConfirmPassword("");
      setSignupEmailStatus("unknown");
      return;
    }

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
        setMessage("An account with this email already exists. Please sign in.");
      }

      setSignupStep("email");
      setPassword("");
      setConfirmPassword("");
      setSignupEmailStatus("unknown");
      return;
    }

    setMessage("Check your email to confirm your account.");
    setSignupStep("email");
    setPassword("");
    setConfirmPassword("");
    setSignupEmailStatus("unknown");
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    if (mode === "signup" && signupStep === "email") {
      try {
        const ok = await checkEmailBeforeSignup();

        if (ok) {
          setSignupStep("profile");
        }
      } catch {
        setMessage("Unable to verify this email right now. Try again.");
      }

      setIsSubmitting(false);
      return;
    }

    if (mode === "signup" && signupStep === "profile") {
      const normalizedUsername = await checkUsernameAvailability();

      if (normalizedUsername) {
        setUsername(normalizedUsername);
        setSignupStep("password");
      }

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
      await handleSignupSubmit();
      setIsSubmitting(false);
      return;
    }

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
            disabled={signupStep !== "email"}
            required
          />
          {signupStep !== "email" ? (
            <div className="mt-2 text-right">
              <button
                type="button"
                onClick={() => {
                  if (signupStep === "profile") {
                    setSignupStep("email");
                    return;
                  }

                  setSignupStep("profile");
                  setPassword("");
                  setConfirmPassword("");
                  setMessage(null);
                }}
                className="text-xs uppercase tracking-[0.3em] text-ink/60 underline"
              >
                Back
              </button>
            </div>
          ) : null}
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

      {mode === "signup" && signupStep === "profile" ? (
        <>
          <div>
            <label className="text-xs uppercase tracking-[0.3em] text-ink/50">
              Username
            </label>
            <input
              type="text"
              placeholder="yourname"
              className="mt-2 w-full rounded-xl border border-ink/20 bg-transparent px-3 py-2 text-sm text-ink placeholder:text-ink/40"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
            <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-ink/45">
              Lowercase letters, numbers, underscore.
            </p>
          </div>

          <div>
            <label className="text-xs uppercase tracking-[0.3em] text-ink/50">
              Display name
            </label>
            <input
              type="text"
              placeholder="Your name"
              className="mt-2 w-full rounded-xl border border-ink/20 bg-transparent px-3 py-2 text-sm text-ink placeholder:text-ink/40"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
            />
          </div>
        </>
      ) : null}

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

          {mode === "signup" ? (
            <p
              className={`mt-2 text-[11px] uppercase tracking-[0.2em] ${strengthClasses(
                passwordStrength.label
              )}`}
            >
              Strength: {passwordStrength.label}
            </p>
          ) : null}

          {mode === "login" && !isRecoveryMode ? (
            <div className="mt-2 text-right">
              <button
                type="button"
                onClick={handleReset}
                className="text-xs uppercase tracking-[0.3em] text-ink/60 underline"
              >
                Forgot password
              </button>
            </div>
          ) : null}
        </div>
      )}

      {(mode === "signup" && signupStep === "password") ||
      (mode === "login" && isRecoveryMode) ? (
        <div>
          <label className="text-xs uppercase tracking-[0.3em] text-ink/50">
            Confirm password
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
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting
          ? "Working"
          : mode === "login" && isRecoveryMode
            ? "Update password"
            : mode === "signup" && signupStep === "email"
              ? "Continue"
              : mode === "signup" && signupStep === "profile"
                ? "Continue"
                : mode === "signup"
                  ? "Create account"
                  : "Sign in"}
      </Button>

      {message ? (
        <p className="text-xs uppercase tracking-[0.25em] text-ink/50">
          {message}
        </p>
      ) : null}
    </form>
  );
}
