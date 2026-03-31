import ContentCard from "../components/ContentCard";
import { ButtonLink } from "../components/Button";
import {
  getActiveCategoriesBySlugs,
  getPublicCollections,
} from "../lib/data/collections";
import { createSupabaseServerClient } from "../lib/supabase/server";

const homepageFeaturedCategorySlugs = [
  "cat-001",
  "cat-041",
  "cat-061",
  "cat-062",
  "cat-076",
];

const faqs = [
  {
    question: "What can I publish on Loadouts?",
    answer:
      "You can publish gear stacks, software workflows, desk setups, studio kits, and creator-specific tool combinations that help people understand how your work actually gets made.",
  },
  {
    question: "Do I need to finish my profile before posting?",
    answer:
      "Yes. A complete profile with a username and display name is required before you can create loadouts, comment, like, or follow other creators.",
  },
  {
    question: "Are categories fixed or can users create new ones?",
    answer:
      "Categories are fixed to the current A to Z system so discovery stays structured. Users add their loadouts under the most relevant existing category instead of creating new category types.",
  },
  {
    question: "Can I keep a loadout private while editing it?",
    answer:
      "Yes. You can keep a loadout in draft mode while you add products, notes, images, and links, then make it public when the setup is ready to share.",
  },
];

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [featuredCategories, featuredLoadouts] = await Promise.all([
    getActiveCategoriesBySlugs(homepageFeaturedCategorySlugs),
    getPublicCollections({ limit: 6, kind: "loadout" }),
  ]);

  return (
    <div className="space-y-8 text-[#f4f5f7]">
      <section className="grid gap-10 rounded-3xl border border-white/[0.05] bg-[#2f2f2f] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_24px_48px_rgba(0,0,0,0.18)] sm:p-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:p-10">
        <div className="space-y-6">
          <h1 className="text-[clamp(2.6rem,6vw,4.75rem)] font-semibold leading-[0.95] text-white">
            Build and share the loadouts that power your best work.
          </h1>
          <p className="max-w-2xl text-base text-white/68">
            A curated hub for tools, workflows, and product stacks.
          </p>
          <div className="flex flex-wrap gap-3">
            {user ? (
              <>
                <ButtonLink href="/studio">Open Studio</ButtonLink>
                <ButtonLink href="/loadouts/new" variant="secondary">
                  Create Loadout
                </ButtonLink>
              </>
            ) : (
              <>
                <ButtonLink href="/signup">Sign up</ButtonLink>
                <ButtonLink href="/categories" variant="secondary">
                  Browse Categories
                </ButtonLink>
              </>
            )}
          </div>
          <div className="flex flex-wrap gap-6 text-[11px] font-semibold uppercase tracking-[0.35em] text-white/48">
            <span>Created daily</span>
            <span>Curated by creators</span>
            <span>Save &amp; revisit</span>
          </div>
        </div>

        <div className="rounded-3xl border border-white/[0.06] bg-[#1f1f1f] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_18px_36px_rgba(0,0,0,0.16)]">
          <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111111]">
            <img
              src="/media/loadouts-workflow.gif"
              alt="Animated walkthrough of the current Loadouts pages and workflows"
              className="aspect-video w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-[clamp(1.8rem,3vw,2.5rem)] font-semibold text-white">
            Featured Categories
          </h2>
        </div>
        {featuredCategories.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
            {featuredCategories.map((category) => (
              <ContentCard
                key={category.id}
                id={category.slug}
                title={category.title}
                description={category.description}
                coverImageUrl={category.coverImageUrl}
                href={`/categories/${category.slug}`}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-white/[0.04] bg-[#171717] p-7">
            <h3 className="text-xl font-semibold text-white">
              Category discovery is empty right now
            </h3>
            <p className="mt-2 text-sm text-white/70">
              Seed the fixed category catalog, then use category pages to start
              attaching real creator loadouts.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <ButtonLink href="/categories">Open Categories</ButtonLink>
              {user ? (
                <ButtonLink href="/loadouts/new" variant="secondary">
                  Create Loadout
                </ButtonLink>
              ) : (
                <ButtonLink href="/signup" variant="secondary">
                  Sign up
                </ButtonLink>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-[clamp(1.8rem,3vw,2.5rem)] font-semibold text-white">
            Featured Loadouts
          </h2>
        </div>
        {featuredLoadouts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {featuredLoadouts.map((loadout) => (
              <ContentCard
                key={loadout.id}
                id={loadout.slug}
                title={loadout.title}
                author={loadout.author}
                description={loadout.description}
                coverImageUrl={loadout.coverImageUrl}
                coverImageSourceUrl={loadout.coverImageSourceUrl}
                href={loadout.path}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-white/[0.04] bg-[#171717] p-7">
            <h3 className="text-xl font-semibold text-white">
              No featured loadouts yet
            </h3>
            <p className="mt-2 text-sm text-white/70">
              Public loadouts appear here after a creator finishes onboarding,
              adds products, and publishes a stack.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {user ? (
                <>
                  <ButtonLink href="/loadouts/new">Create Loadout</ButtonLink>
                  <ButtonLink href="/studio" variant="secondary">
                    Open Studio
                  </ButtonLink>
                </>
              ) : (
                <>
                  <ButtonLink href="/signup">Sign up</ButtonLink>
                  <ButtonLink href="/categories" variant="secondary">
                    Explore Categories
                  </ButtonLink>
                </>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-white/[0.04] bg-[#171717] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_18px_36px_rgba(0,0,0,0.16)]">
        <h2 className="text-lg font-semibold text-white">FAQ</h2>
        <div className="mt-5 space-y-3">
          {faqs.map((item) => (
            <details
              key={item.question}
              className="group rounded-2xl border border-white/[0.05] bg-[#111111] px-4 py-3"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-white marker:content-none">
                <span>{item.question}</span>
                <span className="text-lg leading-none text-[#e6ef92] transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 pr-8 text-sm text-white/68">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
