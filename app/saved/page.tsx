import CollectionCard from "../../components/CollectionCard";
import { ButtonLink } from "../../components/Button";

const myLoadouts = [
  {
    id: "l1",
    title: "{{LOADOUT_NAME}}",
    author: "{{USER_HANDLE}}",
    description: "Primary loadout placeholder.",
  },
  {
    id: "l2",
    title: "{{LOADOUT_NAME}}",
    author: "{{USER_HANDLE}}",
    description: "Secondary loadout placeholder.",
  },
  {
    id: "l3",
    title: "{{LOADOUT_NAME}}",
    author: "{{USER_HANDLE}}",
    description: "Travel setup placeholder.",
  },
];

export default function SavedPage() {
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
            Create new loadouts, then come back to review and update them.
          </p>
        </div>
        <ButtonLink href="/loadouts/new" variant="secondary">
          + Create Loadout
        </ButtonLink>
      </header>

      <section className="grid gap-6 md:grid-cols-[280px_1fr]">
        <aside className="rounded-3xl border border-ink/15 bg-paper/80 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-ink/50">
            Quick Actions
          </p>
          <div className="mt-4 space-y-3 text-sm text-ink/70">
            <div className="rounded-2xl border border-ink/10 px-3 py-2">
              Start a new loadout
            </div>
            <div className="rounded-2xl border border-ink/10 px-3 py-2">
              Import from a template
            </div>
            <div className="rounded-2xl border border-ink/10 px-3 py-2">
              Share your favorite stack
            </div>
          </div>
        </aside>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-ink/50">
              Your Loadouts
            </p>
            <span className="text-[11px] uppercase tracking-[0.3em] text-ink/40">
              {myLoadouts.length} total
            </span>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {myLoadouts.map((loadout) => (
              <CollectionCard
                key={loadout.id}
                {...loadout}
                href={`/loadouts/${loadout.id}`}
                ctaLabel="View loadout"
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
