import CollectionCard from "../../../components/CollectionCard";
import Avatar from "../../../components/Avatar";
import Button from "../../../components/Button";

interface ProfilePageProps {
  params: {
    userHandle: string;
  };
}

const userCategories = [
  {
    id: "c1",
    title: "{{CATEGORY_NAME}}",
    author: "{{USER_HANDLE}}",
    description: "Placeholder category on a user profile.",
  },
  {
    id: "c2",
    title: "{{CATEGORY_NAME}}",
    author: "{{USER_HANDLE}}",
    description: "Another placeholder category card.",
  },
];

export default function ProfilePage({ params }: ProfilePageProps) {
  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-center justify-between gap-6 rounded-3xl border border-ink/15 bg-paper/80 p-6">
        <div className="flex items-center gap-4">
          <Avatar alt="User avatar" size="lg" />
          <div>
            <p className="text-[11px] uppercase tracking-[0.45em] text-ink/50">
              Profile
            </p>
            <h1 className="text-[clamp(1.6rem,2.6vw,2.3rem)] font-semibold text-ink">
              @{params.userHandle}
            </h1>
            <p className="mt-1 text-sm text-ink/70">
              {"{{USER_BIO}}"} — placeholder bio for a user profile.
            </p>
          </div>
        </div>
        <Button>Edit Profile</Button>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-ink">
          Categories by @{params.userHandle}
        </h2>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          {userCategories.map((category) => (
            <CollectionCard key={category.id} {...category} />
          ))}
        </div>
      </section>
    </div>
  );
}
