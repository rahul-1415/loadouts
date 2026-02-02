import CollectionCard from "../../../components/CollectionCard";
import Avatar from "../../../components/Avatar";
import Button from "../../../components/Button";

interface ProfilePageProps {
  params: {
    userHandle: string;
  };
}

const userCollections = [
  {
    id: "c1",
    title: "{{COLLECTION_NAME}}",
    author: "{{USER_HANDLE}}",
    description: "Placeholder collection on a user profile.",
  },
  {
    id: "c2",
    title: "{{COLLECTION_NAME}}",
    author: "{{USER_HANDLE}}",
    description: "Another placeholder collection card.",
  },
];

export default function ProfilePage({ params }: ProfilePageProps) {
  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-4">
          <Avatar alt="User avatar" size="lg" />
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
              Profile
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">
              @{params.userHandle}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {"{{USER_BIO}}"} — placeholder bio for a user profile.
            </p>
          </div>
        </div>
        <Button>Edit Profile</Button>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-900">
          Collections by @{params.userHandle}
        </h2>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          {userCollections.map((collection) => (
            <CollectionCard key={collection.id} {...collection} />
          ))}
        </div>
      </section>
    </div>
  );
}
