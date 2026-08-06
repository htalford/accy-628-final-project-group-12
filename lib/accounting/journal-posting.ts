import { accountNameForCode } from "@/lib/accounting/chart-of-accounts";
import { roundMoney } from "@/lib/accounting/calculations";
import type {
  ExpenseType,
  JournalEntrySourceType,
  OperatingExpenseCategory,
  PlacementType,
} from "@/lib/types/database";

export type JournalPostingLine = {
  accountCode: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
};

export type JournalPostingDraft = {
  entryDate: string;
  memo: string;
  reference: string;
  sourceType: JournalEntrySourceType;
  sourceId: string;
  lines: JournalPostingLine[];
};

function pair(
  debitCode: string,
  creditCode: string,
  amount: number,
  description: string,
): JournalPostingLine[] {
  const amt = roundMoney(amount);
  if (amt <= 0) return [];
  return [
    {
      accountCode: debitCode,
      accountName: accountNameForCode(debitCode),
      description,
      debit: amt,
      credit: 0,
    },
    {
      accountCode: creditCode,
      accountName: accountNameForCode(creditCode),
      description,
      debit: 0,
      credit: amt,
    },
  ];
}

export function revenueAccountForPlacementType(
  type: PlacementType | string | null | undefined,
): string {
  return type === "permanent" ? "4100" : "4000";
}

export function accountForPlacementExpenseType(
  type: ExpenseType | string,
): string {
  switch (type) {
    case "payroll_tax":
      return "5300";
    case "recruiting_cost":
      return "5200";
    default:
      return "6900";
  }
}

export function accountForOperatingCategory(
  category: OperatingExpenseCategory | string,
): string {
  switch (category) {
    case "office_rent":
      return "6100";
    case "software_tools":
      return "6200";
    case "marketing":
    case "advertising":
      return "6300";
    default:
      return "6900";
  }
}

export function buildInvoiceJournal(input: {
  id: string;
  clientName: string;
  amount: number;
  periodEnd: string;
  placementType?: PlacementType | string | null;
}): JournalPostingDraft | null {
  const revenue = revenueAccountForPlacementType(input.placementType);
  const lines = pair(
    "1200",
    revenue,
    input.amount,
    `Invoice ${input.clientName}`,
  );
  if (!lines.length) return null;
  return {
    entryDate: input.periodEnd,
    memo: `Recognize revenue — ${input.clientName} invoice`,
    reference: `INV-${input.id.replace(/-/g, "").slice(0, 8)}`,
    sourceType: "invoice",
    sourceId: input.id,
    lines,
  };
}

export function buildPaymentJournal(input: {
  id: string;
  amount: number;
  paymentDate: string;
  invoiceId: string;
}): JournalPostingDraft | null {
  const lines = pair("1000", "1200", input.amount, "Cash receipt on invoice");
  if (!lines.length) return null;
  return {
    entryDate: input.paymentDate,
    memo: "Cash receipt on invoice",
    reference: `PMT-${input.id.replace(/-/g, "").slice(0, 8)}`,
    sourceType: "payment",
    sourceId: input.id,
    lines,
  };
}

export function buildTimesheetJournal(input: {
  id: string;
  employeeName: string;
  weekEnding: string;
  grossPay: number;
}): JournalPostingDraft | null {
  const lines = pair(
    "5100",
    "2100",
    input.grossPay,
    `Payroll accrual — ${input.employeeName}`,
  );
  if (!lines.length) return null;
  return {
    entryDate: input.weekEnding,
    memo: `Payroll accrual — ${input.employeeName}`,
    reference: `TS-${input.id.replace(/-/g, "").slice(0, 8)}`,
    sourceType: "timesheet",
    sourceId: input.id,
    lines,
  };
}

export function buildPlacementExpenseJournal(input: {
  id: string;
  expenseType: ExpenseType | string;
  description: string;
  amount: number;
  expenseDate: string;
  status: string;
}): JournalPostingDraft | null {
  const expenseAccount = accountForPlacementExpenseType(input.expenseType);
  const creditAccount = input.status === "reimbursed" ? "1000" : "2200";
  const lines = pair(
    expenseAccount,
    creditAccount,
    input.amount,
    input.description || `Placement expense — ${input.expenseType}`,
  );
  if (!lines.length) return null;
  return {
    entryDate: input.expenseDate,
    memo: `Placement expense — ${String(input.expenseType).replaceAll("_", " ")}`,
    reference: `EXP-${input.id.replace(/-/g, "").slice(0, 8)}`,
    sourceType: "expense",
    sourceId: input.id,
    lines,
  };
}

export function buildOperatingExpenseJournal(input: {
  id: string;
  category: OperatingExpenseCategory | string;
  description: string;
  amount: number;
  expenseDate: string;
}): JournalPostingDraft | null {
  const expenseAccount = accountForOperatingCategory(input.category);
  const lines = pair(
    expenseAccount,
    "1000",
    input.amount,
    input.description || `Operating expense — ${input.category}`,
  );
  if (!lines.length) return null;
  return {
    entryDate: input.expenseDate,
    memo: `Operating expense — ${String(input.category).replaceAll("_", " ")}`,
    reference: `OPEX-${input.id.replace(/-/g, "").slice(0, 8)}`,
    sourceType: "operating_expense",
    sourceId: input.id,
    lines,
  };
}

export function sourceHref(
  sourceType: JournalEntrySourceType | string | null | undefined,
  sourceId: string | null | undefined,
): string | null {
  if (!sourceType || !sourceId) return null;
  switch (sourceType) {
    case "invoice":
    case "payment":
      return sourceType === "invoice"
        ? `/accounting/invoices/${sourceId}`
        : "/accounting/accounts-receivable";
    case "timesheet":
      return `/accounting/timesheets/${sourceId}`;
    case "expense":
    case "operating_expense":
      return "/accounting/expenses";
    default:
      return null;
  }
}
