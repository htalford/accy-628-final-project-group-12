import "server-only";

import { getProfileCompletion } from "@/lib/candidate/profile-completion";
import { getContractCompletion } from "@/lib/candidate/contract-completion";
import {
  formatDate,
  getCandidateApplications,
  getCandidateEmployee,
  getCandidateHiddenThreadRoles,
  getCandidateMessages,
  getCandidatePlacements,
  getCandidateTimesheets,
  getOpenJobs,
} from "@/lib/candidate/data";
import type { ApplicationStatus } from "@/lib/types/database";
import type { CandidateNotification } from "@/lib/candidate/notification-types";
import { candidateNavRootFromHref } from "@/lib/candidate/notification-types";

export type { CandidateNotification } from "@/lib/candidate/notification-types";
export { candidateNavRootFromHref } from "@/lib/candidate/notification-types";

function currentWeekEndingDate() {
  const d = new Date();
  const day = d.getDay();
  const daysSinceSaturday = (day + 1) % 7;
  d.setDate(d.getDate() - daysSinceSaturday);
  return d.toISOString().slice(0, 10);
}

const APPLICATION_STATUS_ALERTS = new Set<ApplicationStatus>([
  "reviewing",
  "interview",
  "offered",
  "rejected",
]);

function applicationJobTitle(app: {
  jobs?:
    | { title?: string | null }
    | { title?: string | null }[]
    | null;
}): string {
  if (Array.isArray(app.jobs)) return app.jobs[0]?.title ?? "Role";
  return app.jobs?.title ?? "Role";
}

function applicationEmployer(app: {
  jobs?:
    | { employer_name?: string | null }
    | { employer_name?: string | null }[]
    | null;
}): string {
  if (Array.isArray(app.jobs)) return app.jobs[0]?.employer_name ?? "Employer";
  return app.jobs?.employer_name ?? "Employer";
}

function notificationForApplicationStatus(app: {
  id: string;
  status: ApplicationStatus;
  updated_at: string;
  interview_at?: string | null;
  interview_type?: string | null;
  candidate_decision?: "accepted" | "declined" | "acknowledged" | null;
  jobs?:
    | {
        title?: string | null;
        employer_name?: string | null;
      }
    | {
        title?: string | null;
        employer_name?: string | null;
      }[]
    | null;
}): CandidateNotification | null {
  if (!APPLICATION_STATUS_ALERTS.has(app.status)) return null;

  // Offers / declines stay in the bell until the candidate takes action.
  if (app.status === "offered" && app.candidate_decision) return null;
  if (app.status === "rejected" && app.candidate_decision === "acknowledged") {
    return null;
  }

  const role = applicationJobTitle(app);
  const employer = applicationEmployer(app);
  const when = formatDate(app.updated_at);

  switch (app.status) {
    case "reviewing":
      return {
        id: `app-status-${app.id}-reviewing`,
        title: "Application under review",
        body: `${role} at ${employer} moved to reviewing.`,
        href: `/candidate/applications?app=${app.id}`,
        time: `Applications · ${when}`,
        tone: "info",
      };
    case "interview": {
      const interviewWhen = app.interview_at
        ? formatDate(app.interview_at)
        : null;
      return {
        id: `app-status-${app.id}-interview`,
        title: app.interview_at
          ? "Interview scheduled"
          : "Application moved to interview",
        body: interviewWhen
          ? `${role} at ${employer} · ${app.interview_type?.trim() || "Interview"} on ${interviewWhen}.`
          : `${role} at ${employer} is now in the interview stage.`,
        href: `/candidate/applications?app=${app.id}`,
        time: `Applications · ${when}`,
        tone: "info",
      };
    }
    case "offered":
      return {
        id: `app-status-${app.id}-offered`,
        title: "Offer received — response needed",
        body: `Accept or decline your offer for ${role} at ${employer}.`,
        href: `/candidate/applications?app=${app.id}`,
        time: `Applications · ${when}`,
        tone: "success",
      };
    case "rejected":
      return {
        id: `app-status-${app.id}-rejected`,
        title: "Application declined — acknowledge needed",
        body: `${role} at ${employer} was not selected. Open to acknowledge.`,
        href: `/candidate/applications?app=${app.id}`,
        time: `Applications · ${when}`,
        tone: "warning",
      };
    default:
      return null;
  }
}

/** Live action items for the candidate top-bar bell, linking to portal tabs. */
export async function loadCandidateNotifications(): Promise<{
  notifications: CandidateNotification[];
  unreadMessageCount: number;
  /** Sidebar hrefs that should show an attention dot. */
  navAttentionHrefs: string[];
}> {
  const [
    { employee },
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

  const items: CandidateNotification[] = [];
  const hidden = new Set(hiddenRoles);
  const unread = messages.filter((m) => {
    if (m.is_read || m.sender_role === "candidate") return false;
    const role =
      m.counterpart_role === "recruiter" ||
      m.counterpart_role === "accounting" ||
      m.counterpart_role === "system"
        ? m.counterpart_role
        : m.sender_role === "accounting"
          ? "accounting"
          : m.sender_role === "system"
            ? "system"
            : "recruiter";
    return !hidden.has(role);
  });
  const unreadMessageCount = unread.length;
  const active = placements.find((p) => p.status === "active") ?? null;
  const weekEnding = currentWeekEndingDate();
  const hasThisWeekTimesheet = timesheets.some(
    (ts) => ts.week_ending_date === weekEnding,
  );
  const pendingPaySheets = timesheets.filter((ts) => ts.status === "submitted");
  const approvedTimesheets = timesheets.filter(
    (ts) => ts.status === "approved",
  );
  const profile = getProfileCompletion(employee);
  const appliedIds = new Set(applications.map((a) => a.job_id));
  const openJobs = jobs.filter((j) => !appliedIds.has(j.id));

  if (unread.length > 0) {
    const latest = unread[0]!;
    items.push({
      id: `msg-${latest.id}`,
      title:
        unread.length === 1
          ? "Unread message"
          : `${unread.length} unread messages`,
      body: latest.subject,
      href: "/candidate/messages",
      time: "Messages",
      tone: "info",
    });
  }

  // One notification per application that reached a meaningful status.
  // Offers/rejects stay until candidate_decision is set.
  const statusAlerts = [...applications]
    .filter((a) => {
      if (!APPLICATION_STATUS_ALERTS.has(a.status)) return false;
      if (a.status === "offered") return !a.candidate_decision;
      if (a.status === "rejected") {
        return a.candidate_decision !== "acknowledged";
      }
      return true;
    })
    .sort((a, b) => {
      // Keep pending offer/decline actions above other status tips.
      const rank = (status: ApplicationStatus) =>
        status === "offered" ? 0 : status === "rejected" ? 1 : 2;
      const byRank = rank(a.status) - rank(b.status);
      if (byRank !== 0) return byRank;
      return b.updated_at.localeCompare(a.updated_at);
    })
    .map((a) => notificationForApplicationStatus(a))
    .filter((n): n is CandidateNotification => n != null);

  // Always keep pending offer/decline alerts even if we truncate later.
  const priorityAlerts = statusAlerts.filter(
    (n) => n.id.includes("-offered") || n.id.includes("-rejected"),
  );
  const otherStatusAlerts = statusAlerts.filter(
    (n) => !n.id.includes("-offered") && !n.id.includes("-rejected"),
  );
  items.push(...priorityAlerts, ...otherStatusAlerts);

  if (approvedTimesheets.length > 0) {
    const latest = approvedTimesheets[0]!;
    items.push({
      id: `ts-approved-${latest.id}`,
      title:
        approvedTimesheets.length === 1
          ? "Timesheet approved"
          : `${approvedTimesheets.length} timesheets approved`,
      body: `Week ending ${formatDate(latest.week_ending_date)} — open your dashboard to celebrate and review pay.`,
      href: "/candidate/dashboard?celebrate=timesheet",
      time: "Timesheets",
      tone: "success",
    });
  }

  if (active && !hasThisWeekTimesheet) {
    items.push({
      id: "ts-due",
      title: "Timesheet due",
      body: `Submit hours for week ending ${weekEnding}.`,
      href: "/candidate/timesheets",
      time: "Timesheets",
      tone: "warning",
    });
  }

  if (pendingPaySheets.length > 0) {
    items.push({
      id: "pay-pending",
      title: "Pay pending approval",
      body: `${pendingPaySheets.length} timesheet${pendingPaySheets.length === 1 ? "" : "s"} awaiting approval.`,
      href: "/candidate/pay",
      time: "Pay",
      tone: "info",
    });
  }

  if (profile.missing.length > 0) {
    items.push({
      id: "profile",
      title: `Profile ${profile.percent}% complete`,
      body: `Still need: ${profile.missing.map((m) => m.label).join(", ")}.`,
      href: "/candidate/profile",
      time: "Profile",
      tone: "warning",
    });
  }

  if (openJobs.length > 0) {
    items.push({
      id: "jobs-open",
      title:
        openJobs.length === 1
          ? "New job available"
          : `${openJobs.length} jobs available`,
      body: openJobs
        .slice(0, 2)
        .map((j) => j.title)
        .join(" · "),
      href: "/candidate/jobs",
      time: "Available jobs",
      tone: "success",
    });
  }

  if (active) {
    const placementSheets = timesheets.filter(
      (ts) => ts.placement_id === active.id,
    );
    const completion = getContractCompletion(active, placementSheets);
    if (completion.percent < 100) {
      items.push({
        id: `completion-${active.id}`,
        title: `Contract ${completion.percent}% complete`,
        body:
          completion.missing[0]?.label != null
            ? `Next: ${completion.missing[0].label}`
            : "Review assignment progress.",
        href: `/candidate/contracts/${active.id}`,
        time: "Contracts",
        tone: "info",
      });
    }
  }

  if (placements.length > 0 && !active) {
    items.push({
      id: "contracts",
      title: "Review your contracts",
      body: `${placements.length} placement${placements.length === 1 ? "" : "s"} on file.`,
      href: "/candidate/contracts",
      time: "Contracts",
      tone: "info",
    });
  }

  if (items.length === 0) {
    items.push({
      id: "all-clear",
      title: "You're all caught up",
      body: "No messages, timesheets, or profile items need attention.",
      href: "/candidate/dashboard",
      time: "Dashboard",
      tone: "success",
    });
  }

  // Prefer keeping offer/decline alerts when capping the list.
  const capped = (() => {
    if (items.length <= 12) return items;
    const mustKeep = items.filter(
      (n) =>
        n.id.includes("-offered") ||
        n.id.includes("-rejected") ||
        n.id.startsWith("msg-"),
    );
    const rest = items.filter((n) => !mustKeep.includes(n));
    return [...mustKeep, ...rest].slice(0, 12);
  })();

  // Sidebar dots track actionable notifications (not the all-clear placeholder).
  const attentionSource = capped.filter((n) => n.id !== "all-clear");
  const navAttentionHrefs = Array.from(
    new Set(
      attentionSource
        .map((n) => candidateNavRootFromHref(n.href))
        .filter((href): href is NonNullable<typeof href> => href != null),
    ),
  );

  return {
    notifications: capped,
    unreadMessageCount,
    navAttentionHrefs,
  };
}
