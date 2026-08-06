import "server-only";

import { getNavForRole } from "@/lib/auth/roles";
import { attentionHrefsFromNotifications } from "@/lib/nav-attention";
import {
  listCandidates,
  listInterviews,
  listJobOrders,
  listMessageThreads,
} from "@/lib/recruiter/data";

export type RecruiterNotification = {
  id: string;
  title: string;
  body: string;
  href: string;
  time: string;
  tone: "warning" | "info" | "success";
};

export type RecruiterNotificationChrome = {
  notifications: RecruiterNotification[];
  navAttentionHrefs: string[];
  unreadMessageCount: number;
};

const RECRUITER_NAV_ROOTS = getNavForRole("recruiter").map((i) => i.href);
const LOW_MATCH_THRESHOLD = 60;

function daysUntil(iso: string): number {
  const target = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(target);
  day.setHours(0, 0, 0, 0);
  return Math.round((day.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function daysPhrase(days: number): string {
  if (days < 0) return "earlier today";
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}

/** Live action items for the recruiter top-bar bell + sidebar attention dots. */
export async function loadRecruiterNotifications(): Promise<RecruiterNotificationChrome> {
  const [threads, interviews, jobs, candidates] = await Promise.all([
    listMessageThreads().catch(() => []),
    listInterviews().catch(() => []),
    listJobOrders().catch(() => []),
    listCandidates().catch(() => []),
  ]);

  const items: RecruiterNotification[] = [];

  const unreadThreads = threads.filter((t) => t.unread > 0);
  const unreadMessageCount = unreadThreads.reduce((s, t) => s + t.unread, 0);
  if (unreadMessageCount > 0) {
    const latest = unreadThreads[0]!;
    items.push({
      id: `msg-${latest.id}`,
      title:
        unreadMessageCount === 1
          ? "Unread message"
          : `${unreadMessageCount} unread messages`,
      body: `${latest.participantName} · ${latest.subject}`,
      href: "/recruiter/messages",
      time: "Messages",
      tone: "info",
    });
  }

  const upcoming = interviews
    .filter((i) => i.status === "Scheduled")
    .map((i) => ({ interview: i, days: daysUntil(i.datetime) }))
    .filter((row) => row.days >= 0 && row.days <= 3)
    .sort((a, b) => a.interview.datetime.localeCompare(b.interview.datetime));

  for (const row of upcoming.slice(0, 4)) {
    const i = row.interview;
    items.push({
      id: `int-${i.id}`,
      title: "Upcoming interview",
      body: `${i.candidate} · ${i.position} · ${daysPhrase(row.days)}`,
      href: "/recruiter/interviews",
      time: `${i.date} ${i.time}`,
      tone: row.days <= 1 ? "warning" : "info",
    });
  }

  const needingCandidates = jobs.filter(
    (j) =>
      (j.status === "Open" || j.status === "Interviewing") &&
      j.assignedCandidateIds.length === 0,
  );
  for (const job of needingCandidates.slice(0, 3)) {
    items.push({
      id: `job-${job.id}`,
      title:
        job.source === "employer_request"
          ? "Employer job request needs candidates"
          : "Open job order needs candidates",
      body: `${job.title} · ${job.company}`,
      href: `/recruiter/job-orders/${job.id}`,
      time: job.status,
      tone: "warning",
    });
  }

  const awaitingReview = candidates.filter(
    (c) =>
      c.status === "Applied" ||
      c.applicationStatus === "submitted" ||
      c.applicationStatus === "reviewing",
  );
  for (const c of awaitingReview.slice(0, 4)) {
    items.push({
      id: `cand-review-${c.id}`,
      title: "Candidate awaiting review",
      body: `${c.name} · ${c.positionApplied}`,
      href: `/recruiter/candidates/${c.employeeId}`,
      time: c.lastUpdated.slice(0, 10),
      tone: "info",
    });
  }

  const lowMatch = candidates.filter(
    (c) =>
      c.source === "job_interest" &&
      c.matchPercent != null &&
      c.matchPercent < LOW_MATCH_THRESHOLD,
  );
  for (const c of lowMatch.slice(0, 3)) {
    items.push({
      id: `cand-low-${c.id}`,
      title: "Low match needs review",
      body: `${c.name} · ${c.matchPercent}% match · ${c.positionApplied}`,
      href: `/recruiter/candidates/${c.employeeId}`,
      time: "Matching",
      tone: "warning",
    });
  }

  const notifications =
    items.length === 0
      ? [
          {
            id: "all-clear",
            title: "You're all caught up",
            body: "No interviews, job orders, candidates, or messages need attention.",
            href: "/recruiter/dashboard",
            time: "Just now",
            tone: "success" as const,
          },
        ]
      : items.slice(0, 12);

  return {
    notifications,
    unreadMessageCount,
    navAttentionHrefs: attentionHrefsFromNotifications(
      notifications,
      RECRUITER_NAV_ROOTS,
    ),
  };
}
