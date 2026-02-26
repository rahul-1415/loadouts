import { notFound, redirect } from "next/navigation";
import NewLoadoutForm from "../../../../components/NewLoadoutForm";
import LoadoutProductsManager from "../../../../components/LoadoutProductsManager";
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
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-[11px] uppercase tracking-[0.45em] text-white/50">
          Edit Loadout
        </p>
        <h1 className="text-[clamp(2rem,3.6vw,3rem)] font-semibold text-white">
          Update your loadout
        </h1>
        <p className="mt-2 text-sm text-white/70">
          Edit category, title, description, and visibility.
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
          isPublic: loadout.is_public,
        }}
      />

      <LoadoutProductsManager
        collectionIdentifier={loadout.slug}
        initialItems={loadoutDetail.products.map((item) => ({
          productId: item.id,
          slug: item.slug,
          name: item.name,
          brand: item.brand,
          description: item.description,
          imageUrl: item.imageUrl,
          productUrl: item.productUrl,
          sourceUrl: item.sourceUrl,
          note: item.note,
          sortOrder: item.sortOrder,
        }))}
      />
    </div>
  );
}
