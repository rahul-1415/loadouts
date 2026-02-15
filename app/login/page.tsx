import Link from "next/link";
import { redirect } from "next/navigation";
import AuthOAuthButtons from "../../components/AuthOAuthButtons";
import AuthPasswordForm from "../../components/AuthPasswordForm";
import {
  getQueryParam,
  sanitizeRedirectPath,
  withNextParam,
} from "../../lib/auth/redirect";
import { createSupabaseServerClient } from "../../lib/supabase/server";

interface LoginPageProps {
  searchParams?: {
    next?: string | string[];
    error?: string | string[];
    mode?: string | string[];
    reset?: string | string[];
  };
}

function getLoginMessage({
  error,
  reset,
}: {
  error: string | null;
  reset: string | null;
}) {
  if (error === "oauth_failed") {
    return "OAuth sign-in failed. Try again.";
  }

  if (error === "verify_failed") {
    return "Email confirmation failed. Request a new confirmation link.";
  }

  if (reset === "success") {
    return "Password updated. Sign in with your new password.";
  }

  return null;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const requestedNextPath = sanitizeRedirectPath(
    getQueryParam(searchParams?.next)
  );
  const nextPath = requestedNextPath ?? "/saved";
  const loginMessage = getLoginMessage({
    error: getQueryParam(searchParams?.error),
    reset: getQueryParam(searchParams?.reset),
  });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(nextPath);
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-ink/15 bg-paper/80 p-8 shadow-[0_20px_40px_rgba(27,29,38,0.1)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-ink/50">
          Login
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-ink">Welcome back</h1>
        <p className="mt-2 text-sm text-ink/70">
          Sign in to create, save, and manage your loadouts.
        </p>
        <AuthPasswordForm mode="login" nextPath={nextPath} />
        <AuthOAuthButtons nextPath={nextPath} />
        {loginMessage && (
          <p className="mt-3 text-xs uppercase tracking-[0.25em] text-ink/50">
            {loginMessage}
          </p>
        )}
        <p className="mt-6 text-xs uppercase tracking-[0.3em] text-ink/50">
          New here?{" "}
          <Link
            className="text-ink underline"
            href={withNextParam("/signup", requestedNextPath)}
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
