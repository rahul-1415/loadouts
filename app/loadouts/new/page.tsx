import Button from "../../../components/Button";

export default function NewLoadoutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-[11px] uppercase tracking-[0.45em] text-ink/50">
          New Loadout
        </p>
        <h1 className="text-[clamp(2rem,3.6vw,3rem)] font-semibold text-ink">
          Create a new loadout
        </h1>
        <p className="mt-2 text-sm text-ink/70">
          Build a loadout with tools, products, and links. Placeholder content
          until the API and database are wired up.
        </p>
      </header>

      <form className="space-y-4 rounded-3xl border border-ink/15 bg-paper/80 p-6">
        <div>
          <label className="text-sm font-medium text-ink" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            placeholder="{{LOADOUT_TITLE}}"
            className="mt-2 w-full rounded-xl border border-ink/20 bg-transparent px-3 py-2 text-sm text-ink placeholder:text-ink/40"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-ink" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            placeholder="Add a short description"
            className="mt-2 w-full rounded-xl border border-ink/20 bg-transparent px-3 py-2 text-sm text-ink placeholder:text-ink/40"
            rows={4}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-ink">Items</label>
          <div className="mt-2 grid gap-3">
            <input
              placeholder="{{PRODUCT_URL}}"
              className="w-full rounded-xl border border-ink/20 bg-transparent px-3 py-2 text-sm text-ink placeholder:text-ink/40"
            />
            <input
              placeholder="{{IMAGE_URL}}"
              className="w-full rounded-xl border border-ink/20 bg-transparent px-3 py-2 text-sm text-ink placeholder:text-ink/40"
            />
          </div>
        </div>
        <Button type="submit">Create Loadout</Button>
      </form>
    </div>
  );
}
