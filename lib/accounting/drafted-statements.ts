import { createClient } from "@/lib/supabase/server";
import {
  getAccountsReceivable,
  getExpenses,
  getInvoices,
  getOperatingExpenses,
  getTimesheets,
} from "@/lib/accounting/queries";
import { money, moneyExact } from "@/lib/accounting/format";
import {
  computeGrossProfit,
  computeOperatingIncome,
  isApprovedTimesheet,
  isCompletedPayment,
  isRecognizedExpense,
  isRecognizedInvoice,
  roundMoney,
  sumMoney,
} from "@/lib/accounting/calculations";
import type {
  ReportFilters,
  ReportId,
  ReportPreview,
} from "@/lib/accounting/reports";

type StatementLine = {
  id: string;
  section: string;
  line: string;
  amount: string;
};

function line(
  id: string,
  section: string,
  label: string,
  amount: number | null,
  opts?: { blank?: boolean },
): StatementLine {
  if (opts?.blank) {
    return { id, section, line: label, amount: "" };
  }
  return {
    id,
    section,
    line: label,
    amount: amount == null ? "" : moneyExact(amount),
  };
}

function statementPreview(
  id: ReportId,
  title: string,
  description: string,
  summary: { label: string; value: string }[],
  rows: StatementLine[],
): ReportPreview {
  return {
    id,
    title,
    description,
    summary,
    columns: [
      { key: "section", header: "Section" },
      { key: "line", header: "Line item" },
      { key: "amount", header: "Amount" },
    ],
    rows: rows.map((r) => ({
      id: r.id,
      cells: {
        section: r.section,
        line: r.line,
        amount: r.amount,
      },
    })),
  };
}

function inDateRange(
  date: string | null | undefined,
  from?: string | null,
  to?: string | null,
): boolean {
  if (!date) return !(from || to);
  const d = date.slice(0, 10);
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}

function matchesClient(
  clientId: string | null | undefined,
  filter?: string | null,
): boolean {
  if (!filter || filter === "all") return true;
  return clientId === filter;
}

export type DraftedFinancials = {
  revenue: number;
  directLabor: number;
  placementExpenses: number;
  operatingExpenses: number;
  totalOperatingCosts: number;
  grossProfit: number;
  netIncome: number;
  collections: number;
  accountsReceivable: number;
  cashFromCustomers: number;
  cashPaidToEmployees: number;
  cashPaidForExpenses: number;
  netCashFromOperating: number;
  netCashFromInvesting: number;
  netCashFromFinancing: number;
  netChangeInCash: number;
  beginningCash: number;
  endingCash: number;
  totalAssets: number;
  accruedPayroll: number;
  totalLiabilities: number;
  beginningRetainedEarnings: number;
  endingRetainedEarnings: number;
  commonStock: number;
  totalEquity: number;
  totalLiabilitiesAndEquity: number;
};

/** Drafted statements from operational TalentQuest data (not a full general ledger). */
export async function getDraftedFinancials(
  filters: ReportFilters = {},
): Promise<DraftedFinancials> {
  const [invoices, timesheets, placementExpenses, operatingExpenses, ar, supabase] =
    await Promise.all([
      getInvoices(),
      getTimesheets(),
      getExpenses(),
      getOperatingExpenses(),
      getAccountsReceivable(),
      createClient(),
    ]);

  const { data: payments } = await supabase
    .from("payments")
    .select("invoice_id, amount, status, payment_date");

  const invoiceById = new Map(invoices.map((i) => [i.id, i]));

  const recognizedRevenue = sumMoney(
    invoices
      .filter(
        (i) =>
          isRecognizedInvoice(i.status) &&
          matchesClient(i.clientId, filters.client) &&
          inDateRange(i.periodEnd, filters.from, filters.to),
      )
      .map((i) => i.amount),
  );

  const directLabor = sumMoney(
    timesheets
      .filter(
        (t) =>
          isApprovedTimesheet(t.status) &&
          matchesClient(t.clientId, filters.client) &&
          inDateRange(t.weekEnding, filters.from, filters.to),
      )
      .map((t) => t.grossPay),
  );

  const placementExp = sumMoney(
    placementExpenses
      .filter(
        (e) =>
          isRecognizedExpense(e.status) &&
          matchesClient(e.clientId, filters.client) &&
          inDateRange(e.expenseDate, filters.from, filters.to),
      )
      .map((e) => e.amount),
  );

  const operatingExp =
    !filters.client || filters.client === "all"
      ? sumMoney(
          operatingExpenses
            .filter((e) =>
              inDateRange(e.expenseDate, filters.from, filters.to),
            )
            .map((e) => e.amount),
        )
      : 0;

  const totalOperatingCosts = roundMoney(placementExp + operatingExp);
  const grossProfit = computeGrossProfit(recognizedRevenue, directLabor);
  const netIncome = computeOperatingIncome(
    recognizedRevenue,
    directLabor,
    totalOperatingCosts,
  );

  const collections = sumMoney(
    (payments ?? [])
      .filter((p) => {
        if (!isCompletedPayment(p.status as string)) return false;
        const inv = invoiceById.get(p.invoice_id as string);
        if (!inv) return false;
        if (!matchesClient(inv.clientId, filters.client)) return false;
        return inDateRange(
          (p.payment_date as string | null) ?? null,
          filters.from,
          filters.to,
        );
      })
      .map((p) => Number(p.amount)),
  );

  const accountsReceivable = sumMoney(
    ar.rows
      .filter((r) => matchesClient(r.clientId, filters.client))
      .map((r) => r.amountDue),
  );

  // Draft cash flow (direct): collections in; payroll & expenses assumed paid in cash.
  const cashFromCustomers = collections;
  const cashPaidToEmployees = directLabor;
  const cashPaidForExpenses = totalOperatingCosts;
  const netCashFromOperating = roundMoney(
    cashFromCustomers - cashPaidToEmployees - cashPaidForExpenses,
  );
  const netCashFromInvesting = 0;
  const netCashFromFinancing = 0;
  const netChangeInCash = roundMoney(
    netCashFromOperating + netCashFromInvesting + netCashFromFinancing,
  );
  const beginningCash = 0;
  const endingCash = roundMoney(beginningCash + netChangeInCash);

  const accruedPayroll = 0;
  const totalLiabilities = accruedPayroll;
  const beginningRetainedEarnings = 0;
  const endingRetainedEarnings = roundMoney(
    beginningRetainedEarnings + netIncome,
  );
  const totalAssets = roundMoney(endingCash + accountsReceivable);
  // Contributed capital plug so the drafted balance sheet balances.
  const commonStock = roundMoney(
    totalAssets - totalLiabilities - endingRetainedEarnings,
  );
  const totalEquity = roundMoney(commonStock + endingRetainedEarnings);
  const totalLiabilitiesAndEquity = roundMoney(
    totalLiabilities + totalEquity,
  );

  return {
    revenue: recognizedRevenue,
    directLabor,
    placementExpenses: placementExp,
    operatingExpenses: operatingExp,
    totalOperatingCosts,
    grossProfit,
    netIncome,
    collections,
    accountsReceivable,
    cashFromCustomers,
    cashPaidToEmployees,
    cashPaidForExpenses,
    netCashFromOperating,
    netCashFromInvesting,
    netCashFromFinancing,
    netChangeInCash,
    beginningCash,
    endingCash,
    totalAssets,
    accruedPayroll,
    totalLiabilities,
    beginningRetainedEarnings,
    endingRetainedEarnings,
    commonStock,
    totalEquity,
    totalLiabilitiesAndEquity,
  };
}

export async function buildIncomeStatementReport(
  filters: ReportFilters,
): Promise<ReportPreview> {
  const f = await getDraftedFinancials(filters);
  return statementPreview(
    "income-statement",
    "Income Statement",
    "Drafted staffing P&L from recognized invoices, approved labor, and expenses.",
    [
      { label: "Revenue", value: money(f.revenue) },
      { label: "Gross profit", value: money(f.grossProfit) },
      { label: "Net income", value: money(f.netIncome) },
    ],
    [
      line("r1", "Revenue", "Staffing revenue (recognized invoices)", f.revenue),
      line("r2", "Revenue", "Total revenue", f.revenue),
      line("c1", "Cost of services", "Direct labor (approved timesheets)", f.directLabor),
      line("c2", "Cost of services", "Total cost of services", f.directLabor),
      line("g1", "Gross profit", "Gross profit", f.grossProfit),
      line("o1", "Operating expenses", "Placement expenses", f.placementExpenses),
      line("o2", "Operating expenses", "Operating expenses", f.operatingExpenses),
      line("o3", "Operating expenses", "Total operating expenses", f.totalOperatingCosts),
      line("n1", "Net income", "Operating income / net income (draft)", f.netIncome),
    ],
  );
}

export async function buildBalanceSheetReport(
  filters: ReportFilters,
): Promise<ReportPreview> {
  const f = await getDraftedFinancials(filters);
  return statementPreview(
    "balance-sheet",
    "Balance Sheet",
    "Drafted position from cash collections, open AR, and equity plugs (not a full GL).",
    [
      { label: "Total assets", value: money(f.totalAssets) },
      { label: "Total liabilities", value: money(f.totalLiabilities) },
      { label: "Total equity", value: money(f.totalEquity) },
    ],
    [
      line("a1", "Assets", "Cash", f.endingCash),
      line("a2", "Assets", "Accounts receivable", f.accountsReceivable),
      line("a3", "Assets", "Total assets", f.totalAssets),
      line("l1", "Liabilities", "Accrued payroll", f.accruedPayroll),
      line("l2", "Liabilities", "Total liabilities", f.totalLiabilities),
      line("e1", "Equity", "Common stock (contributed capital, draft plug)", f.commonStock),
      line("e2", "Equity", "Retained earnings", f.endingRetainedEarnings),
      line("e3", "Equity", "Total stockholders' equity", f.totalEquity),
      line(
        "t1",
        "Total",
        "Total liabilities and stockholders' equity",
        f.totalLiabilitiesAndEquity,
      ),
    ],
  );
}

export async function buildCashFlowsReport(
  filters: ReportFilters,
): Promise<ReportPreview> {
  const f = await getDraftedFinancials(filters);
  return statementPreview(
    "cash-flows",
    "Statement of Cash Flows",
    "Drafted direct-method cash flows from collections, payroll, and expenses.",
    [
      { label: "Operating cash flow", value: money(f.netCashFromOperating) },
      { label: "Net change in cash", value: money(f.netChangeInCash) },
      { label: "Ending cash", value: money(f.endingCash) },
    ],
    [
      line("op0", "Operating activities", "Cash flows from operating activities", null, {
        blank: true,
      }),
      line("op1", "Operating activities", "Cash received from customers", f.cashFromCustomers),
      line(
        "op2",
        "Operating activities",
        "Cash paid to employees (approved payroll)",
        -f.cashPaidToEmployees,
      ),
      line(
        "op3",
        "Operating activities",
        "Cash paid for expenses",
        -f.cashPaidForExpenses,
      ),
      line(
        "op4",
        "Operating activities",
        "Net cash from operating activities",
        f.netCashFromOperating,
      ),
      line(
        "inv1",
        "Investing activities",
        "Net cash from investing activities",
        f.netCashFromInvesting,
      ),
      line(
        "fin1",
        "Financing activities",
        "Net cash from financing activities",
        f.netCashFromFinancing,
      ),
      line("n1", "Cash", "Net increase (decrease) in cash", f.netChangeInCash),
      line("n2", "Cash", "Cash at beginning of period", f.beginningCash),
      line("n3", "Cash", "Cash at end of period", f.endingCash),
    ],
  );
}
