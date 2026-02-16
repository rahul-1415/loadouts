import NewLoadoutForm from "../../../components/NewLoadoutForm";
import { getActiveCategoryOptions } from "../../../lib/data/collections";

export default async function NewLoadoutPage() {
  const categories = await getActiveCategoryOptions();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-[11px] uppercase tracking-[0.45em] text-white/50">
          New Loadout
        </p>
        <h1 className="text-[clamp(2rem,3.6vw,3rem)] font-semibold text-white">
          Create a new loadout
        </h1>
        <p className="mt-2 text-sm text-white/70">
          Pick a category first, then publish your loadout under it.
        </p>
      </header>

      <NewLoadoutForm categories={categories} />

      {categories.length === 0 ? (
        <p className="text-sm text-white/70">
          No categories available yet. Run `supabase/seed-100-categories.sql`
          first.
        </p>
      ) : null}
    </div>
  );
}
