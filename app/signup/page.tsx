import Link from "next/link";
import Button from "../../components/Button";
import EmailAuthForm from "../../components/EmailAuthForm";

export default function SignupPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-ink/15 bg-paper/80 p-8 shadow-[0_20px_40px_rgba(27,29,38,0.1)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-ink/50">
          Sign up
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-ink">
          Create your Loadouts account
        </h1>
        <p className="mt-2 text-sm text-ink/70">
          Join to build, save, and share curated loadouts and categories.
        </p>
        <div className="mt-6 space-y-3">
          <Button className="w-full">Sign up with GitHub</Button>
          <Button variant="secondary" className="w-full">
            Sign up with Google
          </Button>
        </div>
        <EmailAuthForm />
        <p className="mt-6 text-xs uppercase tracking-[0.3em] text-ink/50">
          Already have an account?{" "}
          <Link className="text-ink underline" href="/login">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
