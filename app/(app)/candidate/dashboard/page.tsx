import Link from "next/link";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel, StatusPill } from "@/components/candidate/ui";
import { ProfileCompletionCard } from "@/components/candidate/profile-completion-card";
import { getProfileCompletion } from "@/lib/candidate/profile-completion";
import { MatchScoreBadge, MatchedSkills } from "@/components/matching/match-score-badge";
import {
  formatCurrency,
  formatDate,
  getCandidateApplications,
  getCandidateEmployee,
  getCandidateHiddenThreadRoles,
  getCandidateMessages,
  getCandidatePlacements,
  getCandidateTimesheets,
  getOpenJobs,
} from "@/lib/candidate/data";
import {
  candidateInputFromEmployee,
  jobInputFromPublicJob,
  rankJobsForCandidate,
  requirementsForPublicJobs,
} from "@/lib/matching";

function firstNameFrom(displayName: string | null | undefined, fallback: string) {
  const raw = (displayName ?? "").trim();
  if (!raw) return fallback;
  return raw.split(/\s+/)[0] ?? fallback;
}

/** Most recent Saturday (common staffing week-ending). */
function currentWeekEndingDate() {
  const d = new Date();
  const day = d.getDay(); // 0 Sun … 6 Sat
  const daysSinceSaturday = (day + 1) % 7;
  d.setDate(d.getDate() - daysSinceSaturday);
  return d.toISOString().slice(0, 10);
}

function ActionLink({
  href,
  children,
  primary = false,
}: {
  href: string;
  children: ReactNode;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        primary
          ? "inline-flex items-center justify-center rounded-md bg-[var(--cf-navy)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--cf-navy-hover)]"
          : "inline-flex items-center justify-center rounded-md border border-[var(--cf-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--cf-ink)] transition hover:border-[var(--cf-navy)]/30 hover:bg-[var(--cf-surface)]"
      }
    >
      {children}
    </Link>
  );
}

export default async function CandidateDashboardPage() {
  const [
    { user, employee },
    placements,
    jobs,
    applications,
    timesheets,
    messages,
    hiddenRoles,
  ] = await Promise.all([
    getCandidateEmployee(),
    getCandidatePlacements(),
    getOpenJobs(),
    getCandidateApplications(),
    getCandidateTimesheets(),
    getCandidateMessages(),
    getCandidateHiddenThreadRoles(),
  ]);

  const active = placements.find((p) => p.status === "active") ?? null;
  const hidden = new Set(hiddenRoles);
  const unread = messages.filter((m) => {
    if (m.is_read || m.sender_role === "candidate") return false;
    const role =
      m.counterpart_role === "recruiter" ||
      m.counterpart_role === "accounting" ||
      m.counterpart_role === "system"
        ? m.counterpart_role
        : "recruiter";
    return !hidden.has(role);
  }).length;

  const weekEnding = currentWeekEndingDate();
  const hasThisWeekTimesheet = timesheets.some(
    (ts) => ts.week_ending_date === weekEnding,
  );
  const timesheetsWaitingToSubmit =
    active && !hasThisWeekTimesheet ? 1 : 0;

  const appliedJobIds = new Set(applications.map((a) => a.job_id));
  const reqMap = await requirementsForPublicJobs(jobs.map((j) => j.id));
  const candidateProfile = candidateInputFromEmployee(employee, {
    titles: applications
      .map((a) => a.jobs?.title)
      .filter(Boolean) as string[],
  });
  const ranked = rankJobsForCandidate(
    jobs.map((j) => {
      const req = reqMap.get(j.id) ?? { skills: [], certifications: [] };
      return jobInputFromPublicJob(j, req.skills, req.certifications);
    }),
    jobs.map((j) => j.id),
    candidateProfile,
    { minScore: 50 },
  );
  const newJobsMatching = ranked.filter(
    (r) => !appliedJobIds.has(r.jobId),
  ).length;
  const topMatches = ranked
    .filter((r) => !appliedJobIds.has(r.jobId))
    .slice(0, 3);
  const jobsById = new Map(jobs.map((j) => [j.id, j]));

  const name = firstNameFrom(
    employee?.first_name ?? user?.name,
    "there",
  );

  const profileCompletion = getProfileCompletion(employee);

  const todos: string[] = [];
  if (profileCompletion.missing.length > 0) {
    todos.push(
      `profile ${profileCompletion.percent}% complete — finish missing details`,
    );
  }
  if (unread > 0) {
    todos.push(
      `${unread} unread message${unread === 1 ? "" : "s"}`,
    );
  }
  if (timesheetsWaitingToSubmit > 0) {
    todos.push(
      `${timesheetsWaitingToSubmit} timesheet waiting to submit`,
    );
  }
  if (newJobsMatching > 0) {
    todos.push(
      `${newJobsMatching} open job${newJobsMatching === 1 ? "" : "s"} with a solid automated match (50%+)`,
    );
  }

  return (
    <div>
      <section className="mb-8 rounded-2xl border border-[var(--cf-border)] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold tracking-[0.14em] text-[var(--cf-accent)] uppercase">
          Candidate home
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--cf-ink)] sm:text-3xl">
          Welcome back, {name}!
        </h1>

        {todos.length > 0 ? (
          <div className="mt-5">
            <p className="text-sm font-medium text-[var(--cf-ink)]">
              You have:
            </p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-[var(--cf-muted)]">
              {todos.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-4 text-sm text-[var(--cf-muted)]">
            You&apos;re caught up — no urgent actions right now. Browse jobs or
            review your contract anytime.
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <ActionLink href="/candidate/timesheets" primary>
            Submit Timesheet
          </ActionLink>
          <ActionLink href="/candidate/messages">View Messages</ActionLink>
          <ActionLink href="/candidate/jobs">Browse Jobs</ActionLink>
        </div>
      </section>

      <div className="mb-8">
        <ProfileCompletionCard completion={profileCompletion} />
      </div>

      {topMatches.length > 0 ? (
        <div className="mb-8">
          <Panel
            title="Recommended for you"
            action={
              <Link
                href="/candidate/jobs"
                className="text-xs font-semibold text-[var(--cf-accent)]"
              >
                View all jobs
              </Link>
            }
          >
            <ul className="divide-y divide-[var(--cf-border)]">
              {topMatches.map((m) => {
                const job = jobsById.get(m.jobId);
                if (!job) return null;
                return (
                  <li
                    key={m.jobId}
                    className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--cf-ink)]">
                        {job.title}
                      </p>
                      <p className="text-xs text-[var(--cf-muted)]">
                        {job.employer_name}
                        {job.location ? ` · ${job.location}` : ""}
                      </p>
                      {m.result.reasons[0] ? (
                        <p className="mt-0.5 text-xs text-[var(--cf-muted)]">
                          {m.result.reasons[0]}
                        </p>
                      ) : null}
                      <MatchedSkills
                        skills={m.result.skillHits}
                        className="mt-1.5"
                        emptyLabel=""
                      />
                      <MatchedSkills
                        skills={m.result.certHits}
                        label="Matched certifications"
                        tone="certs"
                        className="mt-1"
                        emptyLabel=""
                      />
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <MatchScoreBadge
                        score={m.result.score}
                        band={m.result.band}
                        compact
                      />
                      <Link
                        href="/candidate/jobs"
                        className="text-xs font-semibold text-[var(--cf-navy)] hover:underline"
                      >
                        Open board
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>
      ) : null}

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
                {active.end_date
                  ? ` → ${formatDate(active.end_date)}`
                  : " → open"}
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
