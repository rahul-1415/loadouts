import type { SupabaseClient, User } from "@supabase/supabase-js";
import { sanitizeRedirectPath } from "./redirect";
import { normalizeUsername, validateUsername } from "./username";

export interface ProfileIdentity {
  id: string;
  handle: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  interests: string[] | null;
}

interface PendingProfileMetadata {
  pendingHandle: string | null;
  pendingDisplayName: string | null;
}

function parsePendingMetadata(user: User): PendingProfileMetadata {
  const pendingHandle =
    typeof user.user_metadata?.pending_handle === "string"
      ? user.user_metadata.pending_handle
      : null;

  const pendingDisplayName =
    typeof user.user_metadata?.pending_display_name === "string"
      ? user.user_metadata.pending_display_name.trim()
      : null;

  return {
    pendingHandle,
    pendingDisplayName: pendingDisplayName || null,
  };
}

export function isProfileComplete(profile: ProfileIdentity | null) {
  return Boolean(profile?.handle && profile?.display_name);
}

export function resolveOnboardingPath(nextPath: string | null | undefined) {
  const safeNextPath = sanitizeRedirectPath(nextPath ?? null);

  if (!safeNextPath || safeNextPath.startsWith("/onboarding/profile")) {
    return "/onboarding/profile";
  }

  const params = new URLSearchParams({ next: safeNextPath });
  return `/onboarding/profile?${params.toString()}`;
}

export async function getProfileById(
  supabase: SupabaseClient,
  userId: string
): Promise<ProfileIdentity | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,handle,display_name,avatar_url,bio,interests")
    .eq("id", userId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? null) as ProfileIdentity | null;
}

export async function getProfileByHandle(
  supabase: SupabaseClient,
  handle: string
): Promise<ProfileIdentity | null> {
  const normalized = normalizeUsername(handle);
  const { data, error } = await supabase
    .from("profiles")
    .select("id,handle,display_name,avatar_url,bio,interests")
    .eq("handle", normalized)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? null) as ProfileIdentity | null;
}

export async function isUsernameAvailable(
  supabase: SupabaseClient,
  username: string,
  excludedUserId?: string
) {
  const normalizedUsername = normalizeUsername(username);
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("handle", normalizedUsername)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return true;
  }

  if (excludedUserId && data.id === excludedUserId) {
    return true;
  }

  return false;
}

export async function ensureProfileFromUserMetadata(
  supabase: SupabaseClient,
  user: User
): Promise<ProfileIdentity | null> {
  const existingProfile = await getProfileById(supabase, user.id);
  const { pendingHandle, pendingDisplayName } = parsePendingMetadata(user);

  if (!pendingHandle || !pendingDisplayName) {
    return existingProfile;
  }

  const validation = validateUsername(pendingHandle);

  if (!validation.ok) {
    return existingProfile;
  }

  const normalizedHandle = validation.normalizedUsername;
  const available = await isUsernameAvailable(
    supabase,
    normalizedHandle,
    user.id
  );

  if (!available) {
    return existingProfile;
  }

  if (existingProfile?.handle && existingProfile.handle !== normalizedHandle) {
    return existingProfile;
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      handle: existingProfile?.handle ?? normalizedHandle,
      display_name: pendingDisplayName,
      avatar_url: existingProfile?.avatar_url ?? null,
      bio: existingProfile?.bio ?? null,
      interests: existingProfile?.interests ?? [],
    },
    {
      onConflict: "id",
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  return getProfileById(supabase, user.id);
}
