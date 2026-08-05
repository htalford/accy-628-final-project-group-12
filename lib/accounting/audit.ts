import { money, shortId } from "@/lib/accounting/format";
import {
  expenseStatusLabel,
  expenseTypeLabel,
  invoiceDisplayStatus,
  operatingExpenseCategoryLabel,
  placementStatusLabel,
} from "@/lib/accounting/format";
import type {
  ExpenseStatus,
  InvoiceStatus,
  PlacementStatus,
} from "@/lib/types/database";

export type AuditEventType =
  | "invoice"
  | "payment"
  | "timesheet"
  | "expense"
  | "contract";

export type AuditEvent = {
  id: string;
  at: string;
  sortKey: string;
  type: AuditEventType;
  title: string;
  detail: string;
  href: string;
  amount?: number;
  invoiceId?: string | null;
  placementId?: string | null;
  clientId?: string | null;
};

function dateKey(value: string | null | undefined): string {
  if (!value) return "1970-01-01";
  return value.slice(0, 10);
}

function sortEvents(events: AuditEvent[]): AuditEvent[] {
  return [...events].sort((a, b) => b.sortKey.localeCompare(a.sortKey));
}

export function buildInvoiceAuditEvent(input: {
  id: string;
  clientId?: string | null;
  clientName: string;
  amount: number;
  status: InvoiceStatus;
  periodEnd: string;
  createdAt: string;
  placementId?: string | null;
}): AuditEvent {
  const display = invoiceDisplayStatus(input.status, input.periodEnd);
  return {
    id: `inv-${input.id}`,
    at: dateKey(input.createdAt),
    sortKey: input.createdAt,
    type: "invoice",
    title: `Invoice ${shortId(input.id)} · ${display}`,
    detail: `${input.clientName} · period ending ${input.periodEnd}`,
    href: `/accounting/invoices/${input.id}`,
    amount: input.amount,
    invoiceId: input.id,
    placementId: input.placementId ?? null,
    clientId: input.clientId ?? null,
  };
}

export function buildPaymentAuditEvent(input: {
  id: string;
  invoiceId: string;
  amount: number;
  status: string;
  paymentDate: string | null;
  createdAt?: string | null;
}): AuditEvent {
  const at = input.paymentDate ?? input.createdAt ?? "";
  return {
    id: `pay-${input.id}`,
    at: dateKey(at),
    sortKey: at || input.id,
    type: "payment",
    title:
      input.status === "completed" || input.status === "paid"
        ? "Payment collected"
        : `Payment ${input.status}`,
    detail: `Applied to invoice ${shortId(input.invoiceId)}`,
    href: `/accounting/invoices/${input.invoiceId}`,
    amount: input.amount,
    invoiceId: input.invoiceId,
  };
}

export function buildTimesheetAuditEvent(input: {
  id: string;
  employeeName: string;
  clientName: string;
  weekEnding: string;
  status: string;
  grossPay: number;
  placementId: string | null;
}): AuditEvent {
  return {
    id: `ts-${input.id}`,
    at: dateKey(input.weekEnding),
    sortKey: input.weekEnding,
    type: "timesheet",
    title: `Timesheet ${input.status} · ${input.employeeName}`,
    detail: `${input.clientName} · week ending ${input.weekEnding}`,
    href: `/accounting/timesheets/${input.id}`,
    amount: input.grossPay,
    placementId: input.placementId,
  };
}

export function buildExpenseAuditEvent(input: {
  id: string;
  kind: "placement" | "operating";
  label: string;
  detail: string;
  amount: number;
  status: ExpenseStatus | string;
  expenseDate: string;
  placementId: string | null;
  clientId: string | null;
}): AuditEvent {
  const typeLabel =
    input.kind === "placement"
      ? expenseTypeLabel(input.label)
      : operatingExpenseCategoryLabel(input.label);
  const prefix =
    input.kind === "placement" ? "Placement expense" : "Operating expense";
  return {
    id: `${input.kind === "placement" ? "exp" : "opex"}-${input.id}`,
    at: dateKey(input.expenseDate),
    sortKey: input.expenseDate,
    type: "expense",
    title: `${prefix} · ${typeLabel}`,
    detail: `${input.detail} · ${expenseStatusLabel(input.status)}`,
    href: input.placementId
      ? `/accounting/contracts/${input.placementId}`
      : "/accounting/expenses",
    amount: input.amount,
    placementId: input.placementId,
    clientId: input.clientId,
  };
}

export function buildContractAuditEvent(input: {
  id: string;
  clientId?: string | null;
  clientName: string;
  employeeName: string;
  status: PlacementStatus;
  startDate: string;
}): AuditEvent {
  return {
    id: `ctr-${input.id}`,
    at: dateKey(input.startDate),
    sortKey: input.startDate,
    type: "contract",
    title: `Contract ${shortId(input.id)} · ${placementStatusLabel(input.status)}`,
    detail: `${input.clientName} · ${input.employeeName}`,
    href: `/accounting/contracts/${input.id}`,
    placementId: input.id,
    clientId: input.clientId ?? null,
  };
}

export function mergeAuditEvents(
  events: AuditEvent[],
  limit?: number,
): AuditEvent[] {
  const seen = new Set<string>();
  const unique: AuditEvent[] = [];
  for (const event of sortEvents(events)) {
    if (seen.has(event.id)) continue;
    seen.add(event.id);
    unique.push(event);
  }
  return limit != null ? unique.slice(0, limit) : unique;
}

export function formatAuditAmount(amount: number): string {
  return money(amount);
}
