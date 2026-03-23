import { redirect } from "next/navigation";
import { ButtonLink } from "../../components/Button";
import SavedCollectionsGrid from "../../components/SavedCollectionsGrid";
import { getSavedCollectionsByUserId } from "../../lib/data/collections";
import { createSupabaseServerClient } from "../../lib/supabase/server";

export default async function SavedPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/saved");
  }

  const savedItems = await getSavedCollectionsByUserId(user.id, 120);
  const totalCount = savedItems.length;
  const savedLoadouts = savedItems.filter((item) => item.kind === "loadout").length;
  const savedCategories = savedItems.filter((item) => item.kind === "category").length;

  return (
    <div className="space-y-8 text-[#f4f5f7]">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.45em] text-white/50">
            Saved
          </p>
          <h1 className="text-[clamp(2rem,3.6vw,3rem)] font-semibold text-white">
            Your saved items
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Keep the loadouts and category references you want to revisit in one
            place.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/categories" variant="secondary">
            Explore Categories
          </ButtonLink>
          <ButtonLink href="/my-loadouts">My Loadouts</ButtonLink>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-[280px_1fr]">
        <aside className="space-y-4 rounded-3xl border border-white/[0.05] bg-[#171717] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_18px_36px_rgba(0,0,0,0.16)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-white/50">
            Quick Stats
          </p>
          <div className="space-y-3 text-sm text-white/70">
            <div className="rounded-2xl border border-white/[0.08] px-3 py-2">
              Total saved: {totalCount}
            </div>
            <div className="rounded-2xl border border-white/[0.08] px-3 py-2">
              Loadouts: {savedLoadouts}
            </div>
            <div className="rounded-2xl border border-white/[0.08] px-3 py-2">
              Categories: {savedCategories}
            </div>
          </div>
          <div className="space-y-2 pt-1">
            <ButtonLink href="/feed" variant="secondary" className="w-full">
              Browse Feed
            </ButtonLink>
            <ButtonLink href="/my-loadouts" className="w-full">
              Manage My Loadouts
            </ButtonLink>
          </div>
        </aside>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-white/50">
              Saved Items
            </p>
            <span className="text-[11px] uppercase tracking-[0.3em] text-white/40">
              {totalCount} total
            </span>
          </div>

          {savedItems.length === 0 ? (
            <div className="rounded-3xl border border-white/[0.04] bg-[#171717] p-8 text-center">
              <p className="text-[11px] uppercase tracking-[0.35em] text-white/55">
                Empty State
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Save loadouts you want to revisit
              </h2>
              <p className="mt-2 text-sm text-white/70">
                Open any loadout or category and use the save button to keep it here.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <ButtonLink href="/categories" variant="secondary">
                  Explore Categories
                </ButtonLink>
                <ButtonLink href="/feed">Browse Feed</ButtonLink>
              </div>
            </div>
          ) : (
            <SavedCollectionsGrid
              initialItems={savedItems}
              viewerUserId={user.id}
            />
          )}
        </div>
      </section>
    </div>
  );
}
