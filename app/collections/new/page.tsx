import { ButtonLink } from "../../../components/Button";

export default function NewCollectionPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 text-[#f4f5f7]">
      <header>
        <p className="text-[11px] uppercase tracking-[0.45em] text-white/50">
          Categories
        </p>
        <h1 className="text-[clamp(2rem,3.6vw,3rem)] font-semibold text-white">
          Fixed A-Z Category Set
        </h1>
        <p className="mt-2 text-sm text-white/70">
          Categories are fixed to 100 entries (`cat-001` to `cat-100`). Create
          a loadout and assign it to one of those categories.
        </p>
      </header>

      <ButtonLink href="/loadouts/new">Create Loadout</ButtonLink>
    </div>
  );
}
