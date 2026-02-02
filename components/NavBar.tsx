import Link from "next/link";
import Avatar from "./Avatar";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Collections", href: "/collections/new" },
  { label: "Saved", href: "/saved" },
];

export default function NavBar() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-8">
        <Link className="text-lg font-semibold text-slate-900" href="/">
          Loadouts
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              className="transition hover:text-slate-900"
              href={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
            {"{{SEARCH}}"}
          </div>
          <Avatar alt="User avatar" />
        </div>
      </div>
    </header>
  );
}
