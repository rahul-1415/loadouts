import type { Metadata } from "next";
import "../styles/globals.css";
import NavBar from "../components/NavBar";

export const metadata: Metadata = {
  title: "Loadouts",
  description: "Loadouts App (placeholder)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#08090c] text-[#f4f5f7]">
        <div className="flex min-h-screen flex-col">
          <NavBar />
          <main className="flex-1 px-4 py-10 sm:px-6 sm:py-12 lg:px-10 lg:py-16 2xl:px-16">
            <div className="mx-auto w-full max-w-[1200px] 2xl:max-w-[1400px]">
              {children}
            </div>
          </main>
          <footer className="border-t border-white/10 bg-[#0d0f13] px-4 py-6 text-xs uppercase tracking-[0.3em] text-white/55 md:px-8">
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
