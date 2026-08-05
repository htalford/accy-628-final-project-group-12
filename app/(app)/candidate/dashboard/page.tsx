import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel, StatusPill } from "@/components/candidate/ui";
import {
  formatCurrency,
  formatDate,
  getCandidateApplications,
  getCandidateMessages,
  getCandidatePlacements,
  getCandidateTimesheets,
  getOpenJobs,
} from "@/lib/candidate/data";

export default async function CandidateDashboardPage() {
  const [placements, jobs, applications, timesheets, messages] =
    await Promise.all([
      getCandidatePlacements(),
      getOpenJobs(),
      getCandidateApplications(),
      getCandidateTimesheets(),
      getCandidateMessages(),
    ]);

  const active = placements.find((p) => p.status === "active") ?? null;
  const unread = messages.filter((m) => !m.is_read).length;

  return (
    <div>
      <PageHeader
        title="Candidate dashboard"
        description="Your active assignment, open roles, applications, and inbox at a glance."
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Current employer"
          value={active?.clients?.name ?? "None"}
        />
        <StatCard
          label="Placement type"
          value={active?.placement_type ?? "—"}
        />
        <StatCard label="Open jobs" value={String(jobs.length)} />
        <StatCard
          label="Unread messages"
          value={String(unread)}
          hint={`${applications.length} applications`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Active contract"
          action={
            <Link
              href="/candidate/contracts"
              className="text-xs font-semibold text-[var(--cf-accent)]"
            >
              View all
            </Link>
          }
        >
          {active ? (
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{active.clients?.name}</p>
                <StatusPill label={active.status} tone="good" />
              </div>
              <p className="text-[var(--cf-muted)]">
                {active.placement_type} · Pay{" "}
                {formatCurrency(active.pay_rate)} / hr
              </p>
              <p className="text-[var(--cf-muted)]">
                {formatDate(active.start_date)}
                {active.end_date ? ` → ${formatDate(active.end_date)}` : " → open"}
              </p>
            </div>
          ) : (
            <EmptyState
              title="No active placement"
              description="Browse available jobs or check your applications while recruiters finalize your next assignment."
            />
          )}
        </Panel>

        <Panel
          title="Recent timesheets"
          action={
            <Link
              href="/candidate/timesheets"
              className="text-xs font-semibold text-[var(--cf-accent)]"
            >
              Submit hours
            </Link>
          }
        >
          {timesheets.length === 0 ? (
            <p className="text-sm text-[var(--cf-muted)]">No timesheets yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {timesheets.slice(0, 4).map((ts) => (
                <li
                  key={ts.id}
                  className="flex items-center justify-between gap-3"
                >
                  <span>Week of {formatDate(ts.week_ending_date)}</span>
                  <StatusPill
                    label={ts.status}
                    tone={
                      ts.status === "approved"
                        ? "good"
                        : ts.status === "rejected" || ts.status === "disputed"
                          ? "bad"
                          : "warn"
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
