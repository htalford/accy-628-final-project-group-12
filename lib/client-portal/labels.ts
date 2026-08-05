/**
 * Display labels aligned with DB enum seed values
 * (placement_status, timesheet_status, invoice_status).
 */

import type {
  InvoiceStatus,
  PlacementStatus,
  PlacementType,
  TimesheetStatus,
} from "@/lib/types/database";

export function timesheetStatusLabel(status: TimesheetStatus | string): string {
  switch (status) {
    case "submitted":
      return "Submitted";
    case "approved":
      return "Approved";
    case "disputed":
      return "Disputed";
    case "rejected":
      return "Rejected";
    default:
      return String(status);
  }
}

export function invoiceStatusLabel(status: InvoiceStatus | string): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "sent":
      return "Sent";
    case "paid":
      return "Paid";
    case "partial":
      return "Partially Paid";
    case "disputed":
      return "Disputed";
    default:
      return String(status);
  }
}

export function placementStatusLabel(status: PlacementStatus | string): string {
  switch (status) {
    case "active":
      return "Active";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    case "at_risk":
      return "At Risk";
    default:
      return String(status).replaceAll("_", " ");
  }
}

export function placementTypeLabel(type: PlacementType | string): string {
  return type === "permanent" ? "Permanent" : "Temp / Hourly";
}

export function formatMoney(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  const d = date.slice(0, 10);
  return d;
}

/**
 * Same display number accounting uses for contracts (shared placements table).
 * Display-only — routes still use the full placement UUID.
 */
export function shortPlacementNumber(id: string): string {
  const raw = id.replace(/-/g, "").toLowerCase();
  let hash = 2166136261;
  for (let i = 0; i < raw.length; i++) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const n = (hash >>> 0) % 100_000_000;
  return String(n).padStart(8, "0");
}

/** Position / role title for a placement (contracts & employees). */
export function placementPositionTitle(
  title: string | null | undefined,
  placementType?: string | null,
): string {
  const trimmed = title?.trim();
  if (trimmed) return trimmed;
  if (placementType === "permanent") return "Permanent Placement";
  if (placementType === "temp") return "Temporary Assignment";
  return "Assignment";
}

export function shortInvoiceNumber(id: string): string {
  return `INV-${id.replace(/-/g, "").slice(-4).toUpperCase()}`;
}

export function jobRequestStatusLabel(status: string): string {
  switch (status) {
    case "open":
      return "Open";
    case "in_progress":
      return "In Progress";
    case "filled":
      return "Filled";
    case "closed":
      return "Closed";
    default:
      return String(status).replaceAll("_", " ");
  }
}

export function submittalStageLabel(stage: string): string {
  switch (stage) {
    case "submitted":
      return "Submitted";
    case "under_review":
      return "Under Review";
    case "interview":
      return "Interview";
    case "offer":
      return "Offer";
    case "accepted":
      return "Accepted";
    case "rejected":
      return "Rejected";
    default:
      return String(stage).replaceAll("_", " ");
  }
}

/** Badge tone from seed statuses. */
export function seedStatusTone(
  status: string,
): "default" | "navy" | "success" | "warning" | "danger" | "muted" | "accent" {
  const s = status.toLowerCase().replaceAll(" ", "_");
  if (
    ["paid", "approved", "active", "completed", "accepted", "filled"].includes(s)
  )
    return "success";
  if (
    [
      "submitted",
      "sent",
      "draft",
      "partial",
      "at_risk",
      "partially_paid",
      "open",
      "in_progress",
      "under_review",
      "interview",
      "offer",
    ].includes(s) ||
    s.includes("partial")
  )
    return "warning";
  if (["disputed", "rejected", "cancelled", "closed"].includes(s))
    return "danger";
  return "navy";
}
