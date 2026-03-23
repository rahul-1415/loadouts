import { ButtonLink } from "./Button";
import { getStudioInsights } from "../lib/data/analytics";

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not yet";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default async function StudioInsightsPanel({
  userId,
}: {
  userId: string;
}) {
  const insights = await getStudioInsights({ userId });

  return (
    <section className="space-y-6 rounded-3xl border border-ink/15 bg-paper/80 p-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.45em] text-ink/50">
            Studio Insights
          </p>
          <h2 className="text-[clamp(1.6rem,3vw,2.3rem)] font-semibold text-ink">
            Funnel and failure visibility
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-ink/70">
            Track the milestones you have reached, plus recent success and error
            signals from the core content flows.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/notifications" variant="secondary">
            View Notifications
          </ButtonLink>
          <ButtonLink href="/saved">Open Saved</ButtonLink>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4 rounded-3xl border border-ink/12 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[0.35em] text-ink/50">
              Milestones
            </p>
            <span className="text-[11px] uppercase tracking-[0.25em] text-ink/45">
              {insights.milestones.filter((item) => item.completed).length}/
              {insights.milestones.length} done
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {insights.milestones.map((milestone) => (
              <div
                key={milestone.eventName}
                className="rounded-2xl border border-ink/12 bg-[#171717] px-4 py-3"
              >
                <p className="text-sm font-medium text-white">{milestone.label}</p>
                <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-white/55">
                  {milestone.completed
                    ? `Completed ${formatDateTime(milestone.completedAt)}`
                    : "Waiting for first completion"}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-ink/12 bg-white/[0.03] p-5">
          <p className="text-[11px] uppercase tracking-[0.35em] text-ink/50">
            Last 7 Days
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-2xl border border-ink/12 bg-[#171717] px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/50">
                Successful actions
              </p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {insights.totals.last7dSuccesses}
              </p>
            </div>
            <div className="rounded-2xl border border-ink/12 bg-[#171717] px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/50">
                Logged failures
              </p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {insights.totals.last7dFailures}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-3xl border border-ink/12 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[0.35em] text-ink/50">
              Recent Successes
            </p>
            <span className="text-[11px] uppercase tracking-[0.25em] text-ink/45">
              {insights.recentSuccesses.length} tracked
            </span>
          </div>
          {insights.recentSuccesses.length === 0 ? (
            <div className="rounded-2xl border border-ink/12 bg-[#171717] px-4 py-4 text-sm text-white/70">
              No success events recorded yet. Create a loadout, save something,
              or engage with another creator to start building a signal trail.
            </div>
          ) : (
            insights.recentSuccesses.map((item) => (
              <div
                key={`${item.eventName}-${item.createdAt}`}
                className="rounded-2xl border border-ink/12 bg-[#171717] px-4 py-3"
              >
                <p className="text-sm font-medium text-white">{item.context}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-white/50">
                  {item.eventName} • {formatDateTime(item.createdAt)}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="space-y-3 rounded-3xl border border-ink/12 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[0.35em] text-ink/50">
              Recent Failures
            </p>
            <span className="text-[11px] uppercase tracking-[0.25em] text-ink/45">
              {insights.recentFailures.length} tracked
            </span>
          </div>
          {insights.recentFailures.length === 0 ? (
            <div className="rounded-2xl border border-ink/12 bg-[#171717] px-4 py-4 text-sm text-white/70">
              No recent failures logged. If a core auth or content action breaks,
              the latest failure signal will appear here.
            </div>
          ) : (
            insights.recentFailures.map((item) => (
              <div
                key={`${item.eventName}-${item.createdAt}`}
                className="rounded-2xl border border-[#fda4a4]/20 bg-[#171717] px-4 py-3"
              >
                <p className="text-sm font-medium text-white">{item.context}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-white/50">
                  {item.eventName} • {formatDateTime(item.createdAt)}
                </p>
                {item.message ? (
                  <p className="mt-2 text-sm text-[#f6c7c7]">{item.message}</p>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
