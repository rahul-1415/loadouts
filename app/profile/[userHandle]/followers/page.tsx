import Link from "next/link";
import { notFound } from "next/navigation";
import FollowListInfinite from "../../../../components/FollowListInfinite";
import {
  getFollowListByUserId,
  getPublicProfileByHandle,
} from "../../../../lib/data/profiles";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

interface FollowersPageProps {
  params: {
    userHandle: string;
  };
}

export default async function FollowersPage({ params }: FollowersPageProps) {
  const supabase = await createSupabaseServerClient();
  const profile = await getPublicProfileByHandle(params.userHandle, supabase);

  if (!profile) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const initialList = await getFollowListByUserId({
    targetUserId: profile.id,
    direction: "followers",
    viewerUserId: user?.id ?? null,
    limit: 24,
    cursor: null,
    client: supabase,
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Link
          href={`/profile/${profile.handle}`}
          className="text-xs uppercase tracking-[0.3em] text-white/55 underline decoration-white/25 underline-offset-4"
        >
          Back to profile
        </Link>
        <h1 className="text-[clamp(1.8rem,3.2vw,2.6rem)] font-semibold text-white">
          Followers of @{profile.handle}
        </h1>
      </header>

      <FollowListInfinite
        apiPath={`/api/profiles/${profile.handle}/followers`}
        initialItems={initialList.items}
        initialNextCursor={initialList.nextCursor}
        initialHasMore={initialList.hasMore}
        emptyMessage="No followers yet."
        viewerUserId={user?.id ?? null}
      />
    </div>
  );
}
