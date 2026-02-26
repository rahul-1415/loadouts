import { redirect } from "next/navigation";
import { ButtonLink } from "../../components/Button";
import { createSupabaseServerClient } from "../../lib/supabase/server";
import { getOwnedLoadoutsByUserId } from "../../lib/data/collections";

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default async function SavedPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/saved");
  }

  const myLoadouts = await getOwnedLoadoutsByUserId(user.id, 120);
  const totalCount = myLoadouts.length;
  const publicCount = myLoadouts.filter((item) => item.isPublic).length;
  const draftCount = totalCount - publicCount;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.45em] text-ink/50">
            My Loadouts
          </p>
          <h1 className="text-[clamp(2rem,3.6vw,3rem)] font-semibold text-ink">
            Manage and build your loadouts
          </h1>
          <p className="mt-2 text-sm text-ink/70">
            Build drafts, publish when ready, and keep every loadout organized by
            category.
          </p>
        </div>
        <ButtonLink href="/loadouts/new" variant="secondary">
          + Create Loadout
        </ButtonLink>
      </header>

      <section className="grid gap-6 md:grid-cols-[280px_1fr]">
        <aside className="space-y-4 rounded-3xl border border-ink/15 bg-paper/80 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-ink/50">
            Quick Stats
          </p>
          <div className="space-y-3 text-sm text-ink/70">
            <div className="rounded-2xl border border-ink/10 px-3 py-2">
              Total loadouts: {totalCount}
            </div>
            <div className="rounded-2xl border border-ink/10 px-3 py-2">
              Public: {publicCount}
            </div>
            <div className="rounded-2xl border border-ink/10 px-3 py-2">
              Drafts: {draftCount}
            </div>
          </div>
          <div className="space-y-2 pt-1">
            <ButtonLink href="/loadouts/new" className="w-full">
              New Loadout
            </ButtonLink>
          </div>
        </aside>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-ink/50">
              Your Loadouts
            </p>
            <span className="text-[11px] uppercase tracking-[0.3em] text-ink/40">
              {totalCount} total
            </span>
          </div>

          {myLoadouts.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-[#11131a] p-8 text-center">
              <p className="text-[11px] uppercase tracking-[0.35em] text-white/55">
                Empty State
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Create your first loadout
              </h2>
              <p className="mt-2 text-sm text-white/70">
                Start with a category, add details, then publish when you are ready.
              </p>
              <div className="mt-5">
                <ButtonLink href="/loadouts/new">Create Loadout</ButtonLink>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {myLoadouts.map((loadout) => (
                <article
                  key={loadout.id}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-[#11131a] shadow-[0_22px_48px_rgba(0,0,0,0.3)]"
                >
                  <div className="h-40 w-full bg-gradient-to-br from-white/5 via-white/[0.08] to-[#1a2230]">
                    {loadout.coverImageUrl ? (
                      <img
                        src={loadout.coverImageUrl}
                        alt={loadout.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : null}
                  </div>
                  <div className="space-y-4 p-5">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-white/20 px-2.5 py-1 text-[10px] uppercase tracking-[0.23em] text-white/75">
                          {loadout.isPublic ? "Public" : "Draft"}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-white/45">
                          {formatDate(loadout.createdAt)}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-white">
                        {loadout.title}
                      </h3>
                      <p className="text-sm text-white/70">
                        {loadout.description || "No description added yet."}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <ButtonLink
                        href={`/loadouts/${loadout.slug}`}
                        variant="secondary"
                        className="px-4 py-2 text-[10px]"
                      >
                        View
                      </ButtonLink>
                      <ButtonLink
                        href={`/loadouts/${loadout.slug}/edit`}
                        className="px-4 py-2 text-[10px]"
                      >
                        Edit
                      </ButtonLink>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
