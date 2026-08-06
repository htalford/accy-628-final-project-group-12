import "server-only";

import { cache } from "react";
import type {
  Client,
  Employee,
  Invoice,
  InvoiceStatus,
  Placement,
  PlacementStatus,
  TimesheetStatus,
} from "@/lib/types/database";
import { createClient } from "@/lib/supabase/server";
import {
  listJobRequestsForClient,
  listApplicationsForClient,
} from "@/lib/client-portal/portal-data";
import { requireEmployerUser } from "@/lib/client-portal/require-employer";
import type {
  ActionItem,
  ClientPortalData,
  PlacementWithEmployee,
  TimesheetWithDetails,
} from "@/lib/client-portal/types";
import { placementPositionTitle } from "@/lib/client-portal/labels";

export type {
  ActionItem,
  ClientPortalData,
  PlacementWithEmployee,
  TimesheetWithDetails,
} from "@/lib/client-portal/types";

export { requireEmployerUser } from "@/lib/client-portal/require-employer";

function num(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function asPlacement(row: Record<string, unknown>): PlacementWithEmployee {
  const emp = row.employee as Employee | Employee[] | null | undefined;
  const employee = Array.isArray(emp) ? emp[0] ?? null : emp ?? null;
  return {
    id: String(row.id),
    client_id: String(row.client_id),
    employee_id: String(row.employee_id),
    placement_type: row.placement_type as Placement["placement_type"],
    title:
      typeof row.title === "string" && row.title.trim()
        ? row.title.trim()
        : row.placement_type === "permanent"
          ? "Permanent Placement"
          : "Temporary Assignment",
    bill_rate: row.bill_rate == null ? null : num(row.bill_rate),
    pay_rate: row.pay_rate == null ? null : num(row.pay_rate),
    placement_fee: row.placement_fee == null ? null : num(row.placement_fee),
    guarantee_end_date: (row.guarantee_end_date as string | null) ?? null,
    start_date: String(row.start_date),
    end_date: (row.end_date as string | null) ?? null,
    status: row.status as PlacementStatus,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    employee,
  };
}

export const loadClientPortalData = cache(async (): Promise<ClientPortalData> => {
  const user = await requireEmployerUser();
  const clientId = user.linked_client_id!;
  const supabase = await createClient();

  const { data: clientRow } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .maybeSingle();

  const { data: placementRows, error: placementError } = await supabase
    .from("placements")
    .select(
      `
      *,
      employee:employees(*)
    `,
    )
    .eq("client_id", clientId)
    .order("start_date", { ascending: false });

  if (placementError) {
    console.error("client portal placements", placementError.message);
  }

  let placements = (placementRows ?? []).map((r) =>
    asPlacement(r as Record<string, unknown>),
  );

  // If nested employee was filtered by older RLS, load by placement employee_ids.
  const missingEmployeeIds = Array.from(
    new Set(
      placements
        .filter((p) => !p.employee && p.employee_id)
        .map((p) => p.employee_id),
    ),
  );
  if (missingEmployeeIds.length > 0) {
    const { data: empRows } = await supabase
      .from("employees")
      .select("*")
      .in("id", missingEmployeeIds);
    const empById = new Map(
      (empRows ?? []).map((e) => [String(e.id), e as Employee]),
    );
    placements = placements.map((p) =>
      p.employee
        ? p
        : { ...p, employee: empById.get(p.employee_id) ?? null },
    );
  }

  const placementIds = placements.map((p) => p.id);
  const placementById = new Map(placements.map((p) => [p.id, p]));

  let timesheets: TimesheetWithDetails[] = [];
  if (placementIds.length > 0) {
    const { data: tsRows, error: tsError } = await supabase
      .from("timesheets")
      .select("*")
      .in("placement_id", placementIds)
      .order("week_ending_date", { ascending: false });

    if (tsError) {
      console.error("client portal timesheets", tsError.message);
    }

    timesheets = (tsRows ?? []).map((row) => {
      const p = placementById.get(String(row.placement_id)) ?? null;
      const emp = p?.employee;
      const name = emp
        ? `${emp.first_name} ${emp.last_name}`
        : "Unknown employee";
      return {
        id: String(row.id),
        placement_id: String(row.placement_id),
        week_ending_date: String(row.week_ending_date),
        hours_regular: num(row.hours_regular),
        hours_overtime: num(row.hours_overtime),
        status: row.status as TimesheetStatus,
        employer_note:
          row.employer_note == null ? null : String(row.employer_note),
        created_at: String(row.created_at),
        updated_at: String(row.updated_at),
        placement: p,
        employee_name: name,
        position_title:
          p?.title ??
          (p?.placement_type === "permanent"
            ? "Permanent Placement"
            : "Temporary Assignment"),
        bill_rate: p?.bill_rate ?? null,
      };
    });
  }

  const { data: invoiceRows, error: invError } = await supabase
    .from("invoices")
    .select("*")
    .eq("client_id", clientId)
    .order("period_end", { ascending: false });

  if (invError) {
    console.error("client portal invoices", invError.message);
  }

  const invoices: Invoice[] = (invoiceRows ?? []).map((row) => ({
    id: String(row.id),
    client_id: String(row.client_id),
    placement_id: row.placement_id == null ? null : String(row.placement_id),
    period_start: String(row.period_start),
    period_end: String(row.period_end),
    amount: num(row.amount),
    status: row.status as InvoiceStatus,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }));

  // At-risk is internal staffing/margin status — employers must not see those contracts.
  const employerPlacements = placements.filter((p) => p.status !== "at_risk");
  const openPlacements = employerPlacements.filter((p) => p.status === "active");

  // Do not leak at_risk status on timesheet nested placements.
  timesheets = timesheets.map((t) => {
    if (!t.placement || t.placement.status !== "at_risk") return t;
    return {
      ...t,
      placement: { ...t.placement, status: "active" },
    };
  });

  // Jobs board applications for this employer's open postings
  const [portalJobRequests, portalApplications] = await Promise.all([
    listJobRequestsForClient(),
    listApplicationsForClient(),
  ]);

  const metrics = {
    openPositions: portalJobRequests
      .filter((j) => j.status === "open" || j.status === "in_progress")
      .reduce((n, j) => n + j.positions, 0),
    currentEmployees: openPlacements.length,
    pendingCandidateReviews: portalApplications.filter(
      (c) => c.stage === "submitted" || c.stage === "under_review",
    ).length,
    activeContracts: openPlacements.length,
    timesheetsAwaitingApproval: timesheets.filter(
      (t) => t.status === "submitted",
    ).length,
    outstandingInvoices: invoices.filter((i) => i.status !== "paid").length,
  };

  const actionQueue: ActionItem[] = [];

  for (const t of timesheets.filter((x) => x.status === "submitted")) {
    actionQueue.push({
      id: `ts-${t.id}`,
      kind: "timesheet",
      title: "Timesheet awaiting approval",
      detail: `${t.employee_name} · week ending ${t.week_ending_date.slice(0, 10)} · ${t.hours_regular + t.hours_overtime} hrs`,
      status: t.status,
      href: `/client/timesheets/${t.id}`,
    });
  }

  for (const t of timesheets.filter((x) => x.status === "disputed")) {
    actionQueue.push({
      id: `ts-d-${t.id}`,
      kind: "timesheet",
      title: "Timesheet disputed",
      detail: `${t.employee_name} · week ending ${t.week_ending_date.slice(0, 10)}`,
      status: t.status,
      href: `/client/timesheets/${t.id}`,
    });
  }

  for (const inv of invoices.filter(
    (i) => i.status === "disputed" || i.status === "sent" || i.status === "partial",
  )) {
    actionQueue.push({
      id: `inv-${inv.id}`,
      kind: "invoice",
      title:
        inv.status === "disputed"
          ? "Invoice disputed"
          : inv.status === "partial"
            ? "Invoice partially paid"
            : "Invoice awaiting payment",
      detail: `${inv.period_start.slice(0, 10)} – ${inv.period_end.slice(0, 10)} · $${num(inv.amount).toFixed(2)}`,
      status: inv.status,
      href: `/client/invoices/${inv.id}`,
    });
  }

  const recentActivity: ClientPortalData["recentActivity"] = [];

  for (const t of timesheets.slice(0, 4)) {
    recentActivity.push({
      id: `act-ts-${t.id}`,
      title: `Timesheet ${t.status}`,
      detail: `${t.employee_name} · week ending ${t.week_ending_date.slice(0, 10)}`,
      timestamp: t.updated_at.slice(0, 10),
      href: `/client/timesheets/${t.id}`,
    });
  }

  for (const inv of invoices.slice(0, 3)) {
    recentActivity.push({
      id: `act-inv-${inv.id}`,
      title: `Invoice ${inv.status}`,
      detail: `$${num(inv.amount).toFixed(2)} · ${inv.period_start.slice(0, 10)} – ${inv.period_end.slice(0, 10)}`,
      timestamp: inv.updated_at.slice(0, 10),
      href: `/client/invoices/${inv.id}`,
    });
  }

  recentActivity.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));

  return {
    user,
    client: (clientRow as Client | null) ?? null,
    placements: employerPlacements,
    timesheets,
    invoices,
    metrics,
    actionQueue,
    recentActivity: recentActivity.slice(0, 8),
  };
});

export async function getPlacementForClient(
  placementId: string,
): Promise<PlacementWithEmployee | null> {
  const data = await loadClientPortalData();
  return data.placements.find((p) => p.id === placementId) ?? null;
}

export async function getTimesheetForClient(
  timesheetId: string,
): Promise<TimesheetWithDetails | null> {
  const data = await loadClientPortalData();
  return data.timesheets.find((t) => t.id === timesheetId) ?? null;
}

export type InvoiceDetail = Invoice & {
  clientName: string;
  clientBillingEmail: string | null;
  clientIndustry: string | null;
  placementLabel: string | null;
  employeeName: string | null;
  lineItems: {
    id: string;
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }[];
};

export async function getInvoiceForClient(
  invoiceId: string,
): Promise<InvoiceDetail | null> {
  const user = await requireEmployerUser();
  const clientId = user.linked_client_id!;
  const supabase = await createClient();

  const { data: inv, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .eq("client_id", clientId)
    .maybeSingle();

  if (error || !inv) {
    if (error) console.error("client portal invoice", error.message);
    return null;
  }

  const { data: clientRow } = await supabase
    .from("clients")
    .select("name, billing_email, industry")
    .eq("id", clientId)
    .maybeSingle();

  const { data: lineRows } = await supabase
    .from("invoice_line_items")
    .select("id, description, quantity, rate, amount")
    .eq("invoice_id", invoiceId)
    .order("created_at", { ascending: true });

  let placementLabel: string | null = null;
  let employeeName: string | null = null;
  if (inv.placement_id) {
    const { data: placement } = await supabase
      .from("placements")
      .select("id, title, employee:employees(first_name, last_name)")
      .eq("id", inv.placement_id)
      .maybeSingle();
    if (placement) {
      const emp = placement.employee as
        | { first_name: string; last_name: string }
        | { first_name: string; last_name: string }[]
        | null;
      const e = Array.isArray(emp) ? emp[0] : emp;
      employeeName = e ? `${e.first_name} ${e.last_name}` : null;
      placementLabel =
        (placement.title as string | null) ??
        (employeeName ? `Placement · ${employeeName}` : "Assignment");
    }
  }

  let lines = (lineRows ?? []).map((row) => ({
    id: String(row.id),
    description: String(row.description),
    quantity: num(row.quantity),
    rate: num(row.rate),
    amount: num(row.amount),
  }));

  // Fallback synthetic line if seed has header amount but empty lines
  if (lines.length === 0 && num(inv.amount) > 0) {
    lines = [
      {
        id: "synthetic",
        description: placementLabel
          ? `Staffing services · ${placementLabel}`
          : "Staffing services",
        quantity: 1,
        rate: num(inv.amount),
        amount: num(inv.amount),
      },
    ];
  }

  return {
    id: String(inv.id),
    client_id: String(inv.client_id),
    placement_id: inv.placement_id == null ? null : String(inv.placement_id),
    period_start: String(inv.period_start),
    period_end: String(inv.period_end),
    amount: num(inv.amount),
    status: inv.status as InvoiceStatus,
    created_at: String(inv.created_at),
    updated_at: String(inv.updated_at),
    clientName: clientRow?.name ?? "Your company",
    clientBillingEmail: clientRow?.billing_email ?? null,
    clientIndustry: clientRow?.industry ?? null,
    placementLabel,
    employeeName,
    lineItems: lines,
  };
}

/** Employees currently assigned via placements for this employer. */
export function employeesFromPlacements(
  placements: PlacementWithEmployee[],
): Array<{
  employeeId: string;
  placementId: string;
  name: string;
  email: string;
  phone: string | null;
  title: string;
  status: PlacementStatus;
  startDate: string;
  billRate: number | null;
  payRate: number | null;
  placementType: Placement["placement_type"];
  hoursThisPeriod: number;
}> {
  return placements
    .filter((p) => p.employee && p.status === "active")
    .map((p) => ({
      employeeId: p.employee_id,
      placementId: p.id,
      name: `${p.employee!.first_name} ${p.employee!.last_name}`,
      email: p.employee!.email,
      phone: p.employee!.phone,
      title: placementPositionTitle(p.title, p.placement_type),
      status: p.status,
      startDate: p.start_date,
      billRate: p.bill_rate,
      payRate: p.pay_rate,
      placementType: p.placement_type,
      hoursThisPeriod: 0,
    }));
}
