import { redirect } from "next/navigation";
import ProfileOnboardingForm from "../../../components/ProfileOnboardingForm";
import { getQueryParam, sanitizeRedirectPath } from "../../../lib/auth/redirect";
import { getProfileById, isProfileComplete } from "../../../lib/auth/profile";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

interface OnboardingProfilePageProps {
  searchParams?: {
    next?: string | string[];
  };
}

function deriveInitialUsername(email: string | null | undefined) {
  if (!email) {
    return "";
  }

  return email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .slice(0, 30);
}

export default async function OnboardingProfilePage({
  searchParams,
}: OnboardingProfilePageProps) {
  const requestedNextPath = sanitizeRedirectPath(getQueryParam(searchParams?.next));
  const nextPath = requestedNextPath ?? "/saved";

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const onboardingPath = `/onboarding/profile?next=${encodeURIComponent(
      nextPath
    )}`;
    redirect(`/login?next=${encodeURIComponent(onboardingPath)}`);
  }

  const profile = await getProfileById(supabase, user.id);

  if (isProfileComplete(profile)) {
    redirect(nextPath);
  }

  const metadataUsername =
    typeof user.user_metadata?.preferred_username === "string"
      ? user.user_metadata.preferred_username
      : typeof user.user_metadata?.user_name === "string"
        ? user.user_metadata.user_name
        : "";

  const metadataDisplayName =
    typeof user.user_metadata?.name === "string"
      ? user.user_metadata.name
      : typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : user.email?.split("@")[0] ?? "";

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-white/12 bg-[#11131a] p-8 shadow-[0_20px_40px_rgba(0,0,0,0.3)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-white/50">
          Profile setup
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-white">
          Choose your username
        </h1>
        <p className="mt-2 text-sm text-white/70">
          This is your unique profile identifier. You can update profile details
          later, but the username is fixed.
        </p>

        <ProfileOnboardingForm
          nextPath={nextPath}
          initialUsername={
            (profile?.handle ?? metadataUsername) || deriveInitialUsername(user.email)
          }
          initialDisplayName={profile?.display_name ?? metadataDisplayName}
        />
      </div>
    </div>
  );
}
