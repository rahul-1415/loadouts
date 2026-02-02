import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "../styles/globals.css";
import NavBar from "../components/NavBar";

export const metadata: Metadata = {
  title: "Loadouts",
  description: "Loadouts App (placeholder)",
};

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.className} min-h-screen bg-slate-50 text-slate-900`}
      >
        <div className="flex min-h-screen flex-col">
          <NavBar />
          <main className="flex-1 px-4 py-8 md:px-8">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
          <footer className="border-t border-slate-200 bg-white px-4 py-6 text-sm text-slate-500 md:px-8">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
              <span>Loadouts — placeholder footer</span>
              <span>© 2026</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
