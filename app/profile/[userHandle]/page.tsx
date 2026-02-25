import Link from "next/link";
import { notFound } from "next/navigation";
import CollectionCard from "../../../components/CollectionCard";
import FollowButton from "../../../components/FollowButton";
import ProfileEditForm from "../../../components/ProfileEditForm";
import {
  getFollowStats,
  getPublicLoadoutsByOwner,
  getPublicProfileByHandle,
  getViewerFollowsTarget,
} from "../../../lib/data/profiles";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

interface ProfilePageProps {
  params: {
    userHandle: string;
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const supabase = await createSupabaseServerClient();
  const profile = await getPublicProfileByHandle(params.userHandle, supabase);

  if (!profile) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const viewerUserId = user?.id ?? null;
  const isOwner = viewerUserId === profile.id;

  const [stats, loadouts, viewerIsFollowing] = await Promise.all([
    getFollowStats(profile.id, supabase),
    getPublicLoadoutsByOwner(profile.id, profile, 24, supabase),
    getViewerFollowsTarget(viewerUserId, profile.id, supabase),
  ]);

  return (
    <div className="space-y-8">
      <section className="space-y-4 rounded-3xl border border-white/12 bg-[#11131a] p-6 shadow-[0_24px_52px_rgba(0,0,0,0.32)] sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 overflow-hidden rounded-full border border-white/20 bg-white/10">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full w-full place-items-center text-lg font-semibold uppercase text-white/75">
                  {(profile.displayName[0] ?? "U").toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.45em] text-white/50">
                Profile
              </p>
              <h1 className="text-[clamp(1.9rem,3.2vw,2.6rem)] font-semibold text-white">
                {profile.displayName}
              </h1>
              <p className="text-sm uppercase tracking-[0.25em] text-white/55">
                @{profile.handle}
              </p>
            </div>
          </div>

          <FollowButton
            targetHandle={profile.handle}
            initialFollowing={viewerIsFollowing}
            canFollow={Boolean(viewerUserId && !isOwner)}
            refreshOnChange
          />
        </div>

        {profile.bio ? <p className="max-w-3xl text-sm text-white/72">{profile.bio}</p> : null}

        <div className="flex flex-wrap gap-6">
          <Link
            href={`/profile/${profile.handle}/followers`}
            className="text-xs uppercase tracking-[0.3em] text-white/70 underline decoration-white/25 underline-offset-4"
          >
            Followers {stats.followersCount}
          </Link>
          <Link
            href={`/profile/${profile.handle}/following`}
            className="text-xs uppercase tracking-[0.3em] text-white/70 underline decoration-white/25 underline-offset-4"
          >
            Following {stats.followingCount}
          </Link>
          <span className="text-xs uppercase tracking-[0.3em] text-white/40">
            Loadouts {loadouts.length}
          </span>
        </div>

        {profile.interests.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((interest) => (
              <span
                key={interest}
                className="rounded-full border border-white/20 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/70"
              >
                {interest}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      {isOwner ? (
        <ProfileEditForm
          initialDisplayName={profile.displayName}
          initialBio={profile.bio}
          initialAvatarUrl={profile.avatarUrl ?? ""}
          initialInterests={profile.interests}
        />
      ) : null}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-[0.45em] text-white/50">
            Public Loadouts
          </p>
          <span className="text-[11px] uppercase tracking-[0.3em] text-white/40">
            {loadouts.length} total
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loadouts.map((loadout) => (
            <CollectionCard
              key={loadout.id}
              id={loadout.slug}
              title={loadout.title}
              author={loadout.author}
              description={loadout.description}
              coverImageUrl={loadout.coverImageUrl}
              coverImageSourceUrl={loadout.coverImageSourceUrl}
              href={`/loadouts/${loadout.slug}`}
              ctaLabel="View loadout"
            />
          ))}
        </div>

        {loadouts.length === 0 ? (
          <p className="text-sm text-white/70">No public loadouts yet.</p>
        ) : null}
      </section>
    </div>
  );
}
