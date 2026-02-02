import Button from "../../components/Button";

export default function LoginPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-600">
          Sign in to create, save, and manage your loadouts.
        </p>
        <div className="mt-6 space-y-3">
          <Button className="w-full">Sign in with GitHub</Button>
          <Button variant="secondary" className="w-full">
            Sign in with Google
          </Button>
        </div>
        <p className="mt-6 text-xs text-slate-500">
          Placeholder buttons — wire these to NextAuth providers.
        </p>
      </div>
    </div>
  );
}
