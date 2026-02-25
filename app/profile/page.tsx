import { redirect } from "next/navigation";
import { getProfileById, isProfileComplete, resolveOnboardingPath } from "../../lib/auth/profile";
import { createSupabaseServerClient } from "../../lib/supabase/server";

export default async function MyProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/profile");
  }

  const profile = await getProfileById(supabase, user.id);

  if (!isProfileComplete(profile) || !profile?.handle) {
    redirect(resolveOnboardingPath("/profile"));
  }

  redirect(`/profile/${profile.handle}`);
}
