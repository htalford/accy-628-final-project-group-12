import "server-only";

import {
  listJobRequestsForClient,
  listSubmittalsForClient,
} from "@/lib/client-portal/portal-data";
import { loadClientPortalData } from "@/lib/client-portal/queries";
import type {
  ClientNotification,
  ClientPortalChrome,
  ClientSearchHit,
} from "@/lib/client-portal/chrome-shared";

export type {
  ClientNotification,
  ClientPortalChrome,
  ClientSearchHit,
} from "@/lib/client-portal/chrome-shared";
export { filterSearchIndex } from "@/lib/client-portal/chrome-shared";

/** Live bell feed + search index for employer top bar (portal data only). */
export async function loadClientPortalChrome(): Promise<ClientPortalChrome> {
  const data = await loadClientPortalData();
  const [jobRequests, submittals] = await Promise.all([
    listJobRequestsForClient(),
    listSubmittalsForClient(),
  ]);

  const notifications: ClientNotification[] = [];

  for (const item of data.actionQueue.slice(0, 12)) {
    notifications.push({
      id: item.id,
      title: item.title,
      detail: item.detail,
      time: "Needs attention",
      href: item.href,
    });
  }

  for (const s of submittals.filter(
    (c) => c.stage === "submitted" || c.stage === "under_review",
  )) {
    notifications.push({
      id: `sub-${s.id}`,
      title: "Candidate awaiting review",
      detail: `${s.candidate_name} · ${s.position_title}`,
      time: s.updated_at.slice(0, 10),
      href: `/client/candidates/${s.id}`,
    });
  }

  if (notifications.length === 0) {
    notifications.push({
      id: "all-clear",
      title: "You're all caught up",
      detail: "No timesheets, invoices, or submittals need action.",
      time: "Just now",
      href: "/client/dashboard",
    });
  }

  const searchIndex: ClientSearchHit[] = [];

  for (const p of data.placements) {
    const name = p.employee
      ? `${p.employee.first_name} ${p.employee.last_name}`
      : "Placement";
    searchIndex.push({
      id: `emp-${p.employee_id}`,
      category: "Employees",
      label: name,
      sublabel: p.title ?? p.placement_type,
      href: `/client/employees/${p.employee_id}`,
    });
  }

  for (const s of submittals) {
    searchIndex.push({
      id: `cand-${s.id}`,
      category: "Candidates",
      label: s.candidate_name,
      sublabel: `${s.position_title} · ${s.stage}`,
      href: `/client/candidates/${s.id}`,
    });
  }

  for (const j of jobRequests) {
    searchIndex.push({
      id: `job-${j.id}`,
      category: "Jobs",
      label: j.title,
      sublabel: `${j.department} · ${j.status}`,
      href: `/client/job-requests/${j.id}`,
    });
  }

  for (const t of data.timesheets) {
    searchIndex.push({
      id: `ts-${t.id}`,
      category: "Timesheets",
      label: t.employee_name,
      sublabel: `WE ${t.week_ending_date.slice(0, 10)} · ${t.status}`,
      href: `/client/timesheets/${t.id}`,
    });
  }

  for (const inv of data.invoices) {
    searchIndex.push({
      id: `inv-${inv.id}`,
      category: "Invoices",
      label: `Invoice ${inv.id.slice(0, 8)}…`,
      sublabel: `$${Number(inv.amount).toFixed(2)} · ${inv.status}`,
      href: `/client/invoices/${inv.id}`,
    });
  }

  return { notifications, searchIndex };
}
