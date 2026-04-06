import NewLoadoutForm from "../../../components/NewLoadoutForm";
import {
  getActiveCategoryOptions,
  getOwnedLoadoutsByUserId,
} from "../../../lib/data/collections";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

export default async function NewLoadoutPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [categories, existingLoadouts] = await Promise.all([
    getActiveCategoryOptions(),
    user ? getOwnedLoadoutsByUserId(user.id, 200) : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-[1520px] space-y-8 px-4 sm:px-6 lg:px-8">
      <header>
        <p className="text-[11px] uppercase tracking-[0.45em] text-white/50">
          New Loadout
        </p>
        <h1 className="text-[clamp(2rem,3.6vw,3rem)] font-semibold text-white">
          Create a new loadout
        </h1>
        <p className="mt-2 text-sm text-white/70">
          Build the post in four focused steps: category, basics, products, and
          review. Custom boards add a dedicated edit-layout workspace between
          products and review.
        </p>
      </header>

      <NewLoadoutForm
        categories={categories}
        existingLoadoutSlugs={existingLoadouts.map((loadout) => loadout.slug)}
      />

      {categories.length === 0 ? (
        <p className="text-sm text-white/70">
          No categories available yet. Run `supabase/seed-100-categories.sql`
          first.
        </p>
      ) : null}
    </div>
  );
}
