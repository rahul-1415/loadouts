import { notFound, redirect } from "next/navigation";
import NewLoadoutForm from "../../../../components/NewLoadoutForm";
import LoadoutEditorWorkspace from "../../../../components/LoadoutEditorWorkspace";
import {
  getActiveCategoryOptions,
  getPublicCollectionByIdentifier,
  getOwnedLoadoutByIdentifier,
} from "../../../../lib/data/collections";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

interface EditLoadoutPageProps {
  params: {
    id: string;
  };
}

export default async function EditLoadoutPage({ params }: EditLoadoutPageProps) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/loadouts/${encodeURIComponent(params.id)}/edit`);
  }

  const [categories, loadout, loadoutDetail] = await Promise.all([
    getActiveCategoryOptions(),
    getOwnedLoadoutByIdentifier(user.id, params.id),
    getPublicCollectionByIdentifier(params.id, "loadout", user.id),
  ]);

  if (!loadout || !loadoutDetail || loadoutDetail.ownerId !== user.id) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-[1520px] space-y-8 px-4 sm:px-6 lg:px-8">
      <header>
        <p className="text-[11px] uppercase tracking-[0.45em] text-white/50">
          Edit Loadout
        </p>
        <h1 className="text-[clamp(2rem,3.6vw,3rem)] font-semibold text-white">
          Update your loadout
        </h1>
        <p className="mt-2 text-sm text-white/70">
          Save the basics first, then use the workspace below to switch between
          products and a final review of the post.
        </p>
      </header>

      <NewLoadoutForm
        mode="edit"
        identifier={loadout.slug}
        categories={categories}
        initialValues={{
          title: loadout.title,
          description: loadout.description ?? "",
          categoryId: loadout.category_id ?? "",
          coverImageUrl: loadout.cover_image_url ?? "",
          status: loadoutDetail.status,
          layoutMode: loadoutDetail.layoutMode,
        }}
      />

      <LoadoutEditorWorkspace
        collectionIdentifier={loadout.slug}
        initialProducts={loadoutDetail.products}
        layoutMode={loadoutDetail.layoutMode}
        initialLayout={loadoutDetail.bodyLayout}
        title={loadout.title}
        description={loadout.description ?? ""}
        coverImageUrl={loadout.cover_image_url ?? ""}
        categoryLabel={loadoutDetail.category?.title ?? ""}
        statusLabel={loadoutDetail.status}
      />
    </div>
  );
}
