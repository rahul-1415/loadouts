import Link from "next/link";
import { redirect } from "next/navigation";
import SignOutButton from "../../components/SignOutButton";
import { createSupabaseServerClient } from "../../lib/supabase/server";

export default async function MyProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/profile");
  }

  const displayName =
    (typeof user.user_metadata?.name === "string" && user.user_metadata.name) ||
    (typeof user.user_metadata?.full_name === "string" &&
      user.user_metadata.full_name) ||
    (user.email?.split("@")[0] ?? "Profile");

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <section className="rounded-3xl border border-white/12 bg-[#11131a] p-6 shadow-[0_24px_52px_rgba(0,0,0,0.32)] sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-white/50">
          Profile
        </p>
        <h1 className="mt-3 text-[clamp(2rem,3.8vw,3rem)] font-semibold text-white">
          {displayName}
        </h1>
        <p className="mt-2 text-sm text-white/70">
          Account details for your current session.
        </p>

        <dl className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
          <div>
            <dt className="text-[11px] uppercase tracking-[0.3em] text-white/55">
              Email
            </dt>
            <dd className="mt-1 text-white/90">{user.email ?? "No email"}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-[0.3em] text-white/55">
              User ID
            </dt>
            <dd className="mt-1 break-all text-white/75">{user.id}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-[0.3em] text-white/55">
              Last Sign-In
            </dt>
            <dd className="mt-1 text-white/75">
              {user.last_sign_in_at
                ? new Date(user.last_sign_in_at).toLocaleString()
                : "N/A"}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/saved"
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-full border border-white/25 bg-transparent px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#f4f5f7] transition hover:border-white/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35"
          >
            My Loadouts
          </Link>
          <SignOutButton />
        </div>
      </section>
    </div>
  );
}
