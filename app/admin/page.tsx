import Link from "next/link";
import { redirect } from "next/navigation";
import AdminReportActions from "../../components/AdminReportActions";
import { requireAdminUser } from "../../lib/auth/admin";
import { getAdminDashboardData } from "../../lib/data/admin";

export default async function AdminPage() {
  const auth = await requireAdminUser();

  if ("response" in auth) {
    if (auth.response.status === 401) {
      redirect("/login?next=/admin");
    }

    redirect("/");
  }

  const dashboard = await getAdminDashboardData();

  return (
    <div className="space-y-8 text-[#f4f5f7]">
      <header className="space-y-3">
        <p className="text-[11px] uppercase tracking-[0.45em] text-white/50">Admin</p>
        <h1 className="text-[clamp(2rem,3.8vw,3rem)] font-semibold text-white">Moderation and operational review</h1>
        <p className="text-sm text-white/70">Review creator reports, find loadouts with missing cover images, and inspect recent failures.</p>
      </header>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-white/[0.05] bg-[#171717] p-5">
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/50">Open Reports</p>
          <p className="mt-2 text-3xl font-semibold text-white">{dashboard.reports.length}</p>
        </div>
        <div className="rounded-3xl border border-white/[0.05] bg-[#171717] p-5">
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/50">Missing Covers</p>
          <p className="mt-2 text-3xl font-semibold text-white">{dashboard.missingLoadoutImages.length}</p>
        </div>
        <div className="rounded-3xl border border-white/[0.05] bg-[#171717] p-5">
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/50">Recent Failures</p>
          <p className="mt-2 text-3xl font-semibold text-white">{dashboard.recentFailures.length}</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4 rounded-3xl border border-white/[0.05] bg-[#171717] p-6">
          <p className="text-[11px] uppercase tracking-[0.35em] text-white/50">Reports</p>
          {dashboard.reports.length === 0 ? <p className="text-sm text-white/70">No active reports.</p> : null}
          {dashboard.reports.map((report) => (
            <article key={report.id} className="rounded-2xl border border-white/[0.06] bg-[#111111] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-white/45">{report.entity_type}</p>
                  <p className="mt-2 text-sm text-white/70">{report.reason}</p>
                  <p className="mt-2 text-[10px] uppercase tracking-[0.22em] text-white/40">{report.entity_id}</p>
                </div>
                <AdminReportActions reportId={report.id} initialStatus={report.status} />
              </div>
            </article>
          ))}
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-white/[0.05] bg-[#171717] p-6">
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/50">Missing Cover Images</p>
            <div className="mt-4 space-y-3">
              {dashboard.missingLoadoutImages.length === 0 ? <p className="text-sm text-white/70">All current loadouts have cover images.</p> : null}
              {dashboard.missingLoadoutImages.map((item) => (
                <Link key={item.id} href={`/loadouts/${item.slug}/edit`} className="block rounded-2xl border border-white/[0.06] bg-[#111111] px-4 py-3 text-sm text-white/75 transition hover:border-white/[0.14] hover:text-white">
                  {item.title}
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-white/[0.05] bg-[#171717] p-6">
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/50">Recent Failures</p>
            <div className="mt-4 space-y-3">
              {dashboard.recentFailures.length === 0 ? <p className="text-sm text-white/70">No recent failures logged.</p> : null}
              {dashboard.recentFailures.map((failure) => (
                <article key={failure.id} className="rounded-2xl border border-[#fda4a4]/20 bg-[#111111] px-4 py-3">
                  <p className="text-sm font-medium text-white">{failure.context}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-white/45">{failure.event_name}</p>
                  {typeof failure.metadata?.message === "string" ? <p className="mt-2 text-sm text-[#f6c7c7]">{failure.metadata.message}</p> : null}
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
