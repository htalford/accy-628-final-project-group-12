import type {
  ExpenseStatus,
  ExpenseType,
  InvoiceStatus,
  OperatingExpenseCategory,
  PlacementStatus,
  PlacementType,
} from "@/lib/types/database";

export function money(n: number | null | undefined): string {
  const v = Number(n ?? 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(v);
}

export function moneyExact(n: number | null | undefined): string {
  const v = Number(n ?? 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(v);
}

/**
 * Stable public-facing ID: unique-looking 8-digit number derived from a UUID.
 * Routes still use the real UUID; this is display-only.
 */
export function shortId(id: string | null | undefined): string {
  if (!id) return "00000000";
  const raw = id.replace(/-/g, "").toLowerCase();
  // FNV-1a 32-bit hash → 8 decimal digits (00000000–99999999)
  let hash = 2166136261;
  for (let i = 0; i < raw.length; i++) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const n = (hash >>> 0) % 100_000_000;
  return String(n).padStart(8, "0");
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

/** Display status including derived Overdue. */
export function invoiceDisplayStatus(
  status: InvoiceStatus,
  periodEnd: string,
): string {
  if (status === "sent" || status === "partial") {
    const end = new Date(periodEnd + "T00:00:00");
    const due = new Date(end);
    due.setDate(due.getDate() + 30);
    if (due.getTime() < Date.now()) return "Overdue";
  }
  return invoiceStatusLabel(status);
}

export function expenseTypeLabel(type: ExpenseType | string): string {
  const map: Record<string, string> = {
    payroll_tax: "Payroll Tax",
    workers_comp: "Workers Comp",
    benefits: "Benefits",
    recruiting_cost: "Recruiting Cost",
    travel: "Travel",
    equipment: "Equipment",
    other: "Other",
  };
  return map[type] ?? String(type).replaceAll("_", " ");
}

export function operatingExpenseCategoryLabel(
  category: OperatingExpenseCategory | string,
): string {
  const map: Record<string, string> = {
    recruiter_salaries: "Recruiter Salaries",
    accounting_salaries: "Accounting Salaries",
    office_rent: "Office Rent",
    software_tools: "Software / Tools",
    marketing: "Marketing",
    recruiter_labor: "Recruiter Labor",
    advertising: "Advertising",
    background_checks: "Background Checks",
    drug_screening: "Drug Screening",
    payroll: "Payroll",
    employee_wages: "Employee Wages",
    referral_bonuses: "Referral Bonuses",
    training: "Training",
    other: "Other",
  };
  return map[category] ?? String(category).replaceAll("_", " ");
}

/** @deprecated Prefer operatingExpenseCategoryLabel */
export function expenseCategoryLabel(
  category: OperatingExpenseCategory | string,
): string {
  return operatingExpenseCategoryLabel(category);
}

export function expenseStatusLabel(status: ExpenseStatus | string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function placementTypeLabel(type: PlacementType | string): string {
  return type === "permanent" ? "Permanent" : "Temp / Hourly";
}

export function placementStatusLabel(status: PlacementStatus | string): string {
  return status.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function daysBetween(from: string, to = new Date()): number {
  const a = new Date(from + (from.length === 10 ? "T00:00:00" : ""));
  const diff = to.getTime() - a.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export function dueDateFromPeriodEnd(periodEnd: string): string {
  const end = new Date(periodEnd + "T00:00:00");
  end.setDate(end.getDate() + 30);
  return end.toISOString().slice(0, 10);
}

export const EXPENSE_TYPES: ExpenseType[] = [
  "payroll_tax",
  "workers_comp",
  "benefits",
  "recruiting_cost",
  "travel",
  "equipment",
  "other",
];

export const OPERATING_EXPENSE_CATEGORIES: OperatingExpenseCategory[] = [
  "recruiter_salaries",
  "accounting_salaries",
  "office_rent",
  "software_tools",
  "marketing",
  "recruiter_labor",
  "advertising",
  "background_checks",
  "drug_screening",
  "payroll",
  "employee_wages",
  "referral_bonuses",
  "training",
  "other",
];

/** @deprecated Prefer OPERATING_EXPENSE_CATEGORIES */
export const EXPENSE_CATEGORIES = OPERATING_EXPENSE_CATEGORIES;
