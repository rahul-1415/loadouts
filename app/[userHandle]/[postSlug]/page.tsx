import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LoadoutDetailView from "../../../components/LoadoutDetailView";
import {
  getPublicLoadoutByHandleAndSlug,
  getRecommendedLoadoutsForCollection,
} from "../../../lib/data/collections";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

interface UserLoadoutPageProps {
  params: {
    userHandle: string;
    postSlug: string;
  };
}

export async function generateMetadata({
  params,
}: UserLoadoutPageProps): Promise<Metadata> {
  const loadout = await getPublicLoadoutByHandleAndSlug(
    params.userHandle,
    params.postSlug
  );

  if (!loadout) {
    return {
      title: "Loadout Not Found | Loadouts",
    };
  }

  const description =
    loadout.description || `Explore ${loadout.title} on Loadouts.`;

  return {
    title: `${loadout.title} | Loadouts`,
    description,
    openGraph: {
      title: loadout.title,
      description,
      images: loadout.coverImageUrl ? [{ url: loadout.coverImageUrl }] : undefined,
    },
    twitter: {
      card: loadout.coverImageUrl ? "summary_large_image" : "summary",
      title: loadout.title,
      description,
      images: loadout.coverImageUrl ? [loadout.coverImageUrl] : undefined,
    },
  };
}

export default async function UserLoadoutPage({ params }: UserLoadoutPageProps) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const loadout = await getPublicLoadoutByHandleAndSlug(
    params.userHandle,
    params.postSlug,
    user?.id ?? null
  );

  if (!loadout) {
    notFound();
  }

  const isOwner = user?.id === loadout.ownerId;
  const relatedLoadouts = await getRecommendedLoadoutsForCollection({
    collectionId: loadout.id,
    categoryId: loadout.categoryId,
    ownerId: loadout.ownerId,
    viewerUserId: user?.id ?? null,
    limit: 3,
  });

  return (
    <LoadoutDetailView
      loadout={loadout}
      viewerUserId={user?.id ?? null}
      isOwner={isOwner}
      relatedLoadouts={relatedLoadouts}
    />
  );
}
