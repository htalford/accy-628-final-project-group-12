import type { ExpenseStatus, InvoiceStatus } from "@/lib/types/database";

/** Product + ASC 606 aligned helpers for ContractFlow staffing math. */

/** Client bill amount for a timesheet week (OT at 1.5× bill_rate). */
export function computeTimesheetBillAmount(
  hoursRegular: number,
  hoursOvertime: number,
  billRate: number,
): number {
  const regular = hoursRegular * billRate;
  const overtime = hoursOvertime * billRate * 1.5;
  return roundMoney(regular + overtime);
}

/**
 * Candidate gross pay for a timesheet week.
 * Product rule: OT premium is a client billing concept — pay uses flat pay_rate
 * unless product later defines OT pay multiplier.
 */
export function computeTimesheetGrossPay(
  hoursRegular: number,
  hoursOvertime: number,
  payRate: number,
): number {
  return roundMoney((hoursRegular + hoursOvertime) * payRate);
}

/** Temp placement margin $ per regular hour (bill − pay). */
export function computeTempMarginPerHour(
  billRate: number | null,
  payRate: number | null,
): number | null {
  if (billRate == null || payRate == null) return null;
  return roundMoney(billRate - payRate);
}

/** Temp gross margin % on bill rate: (bill − pay) / bill. */
export function computeTempMarginPercent(
  billRate: number | null,
  payRate: number | null,
): number | null {
  if (billRate == null || payRate == null || billRate <= 0) return null;
  return ((billRate - payRate) / billRate) * 100;
}

export function isAtRiskMargin(marginPercent: number | null): boolean {
  return marginPercent != null && marginPercent <= 5;
}

/** Draft invoices are not recognized revenue or AR (ASC 606 / incomplete billing). */
export function isRecognizedInvoice(status: InvoiceStatus | string): boolean {
  return status !== "draft";
}

/**
 * Open trade receivables: billed and not fully settled.
 * Disputed remains AR until resolved/written off (with disclosure).
 */
export function isOpenReceivable(status: InvoiceStatus | string): boolean {
  return (
    status === "sent" ||
    status === "partial" ||
    status === "disputed"
  );
}

/** Completed cash collections only (not pending/failed). */
export function isCompletedPayment(status: string): boolean {
  return status === "completed";
}

/**
 * Direct labor / cost of services: only approved timesheets.
 * Rejected/disputed/submitted are not COS until approved.
 */
export function isApprovedTimesheet(status: string): boolean {
  return status === "approved";
}

/**
 * Operating expense recognition: approved or reimbursed.
 * Pending/rejected do not hit the P&L yet.
 */
export function isRecognizedExpense(status: ExpenseStatus | string): boolean {
  return status === "approved" || status === "reimbursed";
}

export function roundMoney(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function sumMoney(values: number[]): number {
  return roundMoney(values.reduce((s, v) => s + v, 0));
}

/** Net AR = billed amount − completed payments applied (not below zero). */
export function netAmountDue(invoiceAmount: number, paymentsApplied: number): number {
  return Math.max(0, roundMoney(invoiceAmount - paymentsApplied));
}

/**
 * Gross profit (staffing COS view): recognized revenue − direct labor.
 * Operating expenses are excluded from gross profit (shown separately).
 */
export function computeGrossProfit(
  recognizedRevenue: number,
  directLaborCost: number,
): number {
  return roundMoney(recognizedRevenue - directLaborCost);
}

/** Gross margin % = gross profit / recognized revenue. */
export function computeGrossMarginPercent(
  recognizedRevenue: number,
  directLaborCost: number,
): number {
  if (recognizedRevenue <= 0) return 0;
  return (computeGrossProfit(recognizedRevenue, directLaborCost) / recognizedRevenue) * 100;
}

/** Operating income after SG&A-style expenses. */
export function computeOperatingIncome(
  recognizedRevenue: number,
  directLaborCost: number,
  operatingExpenses: number,
): number {
  return roundMoney(
    recognizedRevenue - directLaborCost - operatingExpenses,
  );
}

export function lineItemsBalance(
  invoiceAmount: number,
  lineItemAmounts: number[],
): { lineSum: number; variance: number; balanced: boolean } {
  const lineSum = sumMoney(lineItemAmounts);
  const variance = roundMoney(invoiceAmount - lineSum);
  return {
    lineSum,
    variance,
    balanced: Math.abs(variance) < 0.005,
  };
}

export function yearMonth(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function isCurrentCalendarMonth(dateStr: string, now = new Date()): boolean {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return dateStr.startsWith(`${y}-${m}`);
}
