import "server-only";

import { getProfileCompletion } from "@/lib/candidate/profile-completion";
import { getContractCompletion } from "@/lib/candidate/contract-completion";
import {
  getCandidateApplications,
  getCandidateEmployee,
  getCandidateHiddenThreadRoles,
  getCandidateMessages,
  getCandidatePlacements,
  getCandidateTimesheets,
  getOpenJobs,
} from "@/lib/candidate/data";
import type { CandidateNotification } from "@/lib/candidate/notification-types";

export type { CandidateNotification } from "@/lib/candidate/notification-types";

function currentWeekEndingDate() {
  const d = new Date();
  const day = d.getDay();
  const daysSinceSaturday = (day + 1) % 7;
  d.setDate(d.getDate() - daysSinceSaturday);
  return d.toISOString().slice(0, 10);
}

/** Live action items for the candidate top-bar bell, linking to portal tabs. */
export async function loadCandidateNotifications(): Promise<{
  notifications: CandidateNotification[];
  unreadMessageCount: number;
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
  const profile = getProfileCompletion(employee);
  const appliedIds = new Set(applications.map((a) => a.job_id));
  const openJobs = jobs.filter((j) => !appliedIds.has(j.id));
  const hotApps = applications.filter((a) =>
    ["reviewing", "interview", "offered"].includes(a.status),
  );
  const offeredApps = applications.filter((a) => a.status === "offered");

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

  if (offeredApps.length > 0) {
    const first = offeredApps[0]!;
    const title =
      (Array.isArray(first.jobs) ? first.jobs[0]?.title : first.jobs?.title) ??
      "Role";
    items.push({
      id: "offer-received",
      title:
        offeredApps.length === 1
          ? "Job offer received"
          : `${offeredApps.length} job offers received`,
      body:
        offeredApps.length === 1
          ? `${title} — open your dashboard or Applications to review.`
          : `Including ${title} and ${offeredApps.length - 1} more.`,
      href: "/candidate/dashboard",
      time: "Offers",
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

  if (hotApps.length > 0) {
    items.push({
      id: "apps-update",
      title:
        hotApps.length === 1
          ? "Application update"
          : `${hotApps.length} applications in progress`,
      body: hotApps
        .slice(0, 2)
        .map((a) => {
          const title =
            (Array.isArray(a.jobs) ? a.jobs[0]?.title : a.jobs?.title) ??
            "Role";
          return `${title} · ${a.status}`;
        })
        .join(" · "),
      href: "/candidate/applications",
      time: "Applications",
      tone: "info",
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

  return {
    notifications: items.slice(0, 12),
    unreadMessageCount,
  };
}
