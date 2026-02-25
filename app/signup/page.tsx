import Link from "next/link";
import { redirect } from "next/navigation";
import AuthOAuthButtons from "../../components/AuthOAuthButtons";
import AuthPasswordForm from "../../components/AuthPasswordForm";
import {
  getQueryParam,
  sanitizeRedirectPath,
  withNextParam,
} from "../../lib/auth/redirect";
import {
  getProfileById,
  isProfileComplete,
  resolveOnboardingPath,
} from "../../lib/auth/profile";
import { createSupabaseServerClient } from "../../lib/supabase/server";

interface SignupPageProps {
  searchParams?: {
    next?: string | string[];
  };
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const requestedNextPath = sanitizeRedirectPath(
    getQueryParam(searchParams?.next)
  );
  const nextPath = requestedNextPath ?? "/saved";

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const profile = await getProfileById(supabase, user.id);

    if (!isProfileComplete(profile)) {
      redirect(resolveOnboardingPath(nextPath));
    }

    redirect(nextPath);
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-ink/15 bg-paper/80 p-8 shadow-[0_20px_40px_rgba(27,29,38,0.1)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-ink/50">
          Sign up
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-ink">
          Create your Loadouts account
        </h1>
        <p className="mt-2 text-sm text-ink/70">
          Join to build, save, and share curated loadouts and categories.
        </p>
        <AuthPasswordForm mode="signup" nextPath={nextPath} />
        <AuthOAuthButtons nextPath={nextPath} />
        <p className="mt-6 text-xs uppercase tracking-[0.3em] text-ink/50">
          Already have an account?{" "}
          <Link
            className="text-ink underline"
            href={withNextParam("/login", requestedNextPath)}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
