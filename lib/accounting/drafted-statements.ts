import {
  getAccountsReceivable,
  getExpenses,
  getInvoices,
} from "@/lib/accounting/queries";
import { money, moneyExact } from "@/lib/accounting/format";
import {
  computeGrossProfit,
  computeOperatingIncome,
  isRecognizedExpense,
  isRecognizedInvoice,
  roundMoney,
  sumMoney,
} from "@/lib/accounting/calculations";
import {
  cashFromCustomers,
  cashPaidForExpenses,
  getPostedJournalLines,
  netCredit,
  netDebit,
} from "@/lib/accounting/ledger";
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
  accruedExpenses: number;
  totalLiabilities: number;
  beginningRetainedEarnings: number;
  endingRetainedEarnings: number;
  commonStock: number;
  totalEquity: number;
  totalLiabilitiesAndEquity: number;
};

async function clientSourceIds(
  clientFilter?: string | null,
): Promise<Set<string> | null> {
  if (!clientFilter || clientFilter === "all") return null;
  const [invoices, expenses] = await Promise.all([
    getInvoices(),
    getExpenses(),
  ]);
  const ids = new Set<string>();
  for (const inv of invoices) {
    if (inv.clientId === clientFilter) ids.add(inv.id);
  }
  for (const exp of expenses) {
    if (exp.clientId === clientFilter) ids.add(exp.id);
  }
  // Payments are filtered later via invoice sources; include payment JE by joining.
  return ids;
}

/** Drafted statements from posted general-ledger journal entries. */
export async function getDraftedFinancials(
  filters: ReportFilters = {},
): Promise<DraftedFinancials> {
  const sourceIds = await clientSourceIds(filters.client);
  const asOf = filters.to ?? null;

  const [periodLines, asOfLines, ar] = await Promise.all([
    getPostedJournalLines({
      from: filters.from,
      to: filters.to,
      sourceIds,
    }),
    getPostedJournalLines({
      asOf,
      sourceIds,
    }),
    getAccountsReceivable(),
  ]);

  const linesForPeriod = periodLines;
  const linesAsOf = asOfLines;

  const revenue = netCredit(linesForPeriod, ["4000", "4100"]);
  const directLabor = netDebit(linesForPeriod, ["5100"]);
  const placementExpenses = roundMoney(
    netDebit(linesForPeriod, ["5200", "5300"]) +
      netDebit(linesForPeriod, ["6900"], ["expense"]),
  );
  const operatingExpenses =
    !filters.client || filters.client === "all"
      ? roundMoney(
          netDebit(linesForPeriod, ["6100", "6200", "6300"]) +
            netDebit(linesForPeriod, ["6900"], ["operating_expense"]),
        )
      : 0;

  const totalOperatingCosts = roundMoney(placementExpenses + operatingExpenses);
  const grossProfit = computeGrossProfit(revenue, directLabor);
  const netIncome = computeOperatingIncome(
    revenue,
    directLabor,
    totalOperatingCosts,
  );

  const collections = cashFromCustomers(linesForPeriod);
  const cashPaidEmployees = 0; // payroll is accrued (2100), not cash-settled in demo
  const cashPaidExpenses = cashPaidForExpenses(linesForPeriod);
  const netCashFromOperating = roundMoney(
    collections - cashPaidEmployees - cashPaidExpenses,
  );
  const netCashFromInvesting = 0;
  const netCashFromFinancing = 0;
  const netChangeInCash = roundMoney(
    netCashFromOperating + netCashFromInvesting + netCashFromFinancing,
  );

  const openingCashLines = await getPostedJournalLines({
    to: filters.from
      ? new Date(new Date(filters.from + "T00:00:00").getTime() - 86400000)
          .toISOString()
          .slice(0, 10)
      : "2025-12-31",
    sourceIds,
  });
  const beginningCash = netDebit(openingCashLines, ["1000"]);
  const endingCash = netDebit(linesAsOf, ["1000"]);

  const accountsReceivableGl = netDebit(linesAsOf, ["1200"]);
  const accountsReceivable =
    !filters.client || filters.client === "all"
      ? accountsReceivableGl
      : sumMoney(
          ar.rows
            .filter((r) => matchesClient(r.clientId, filters.client))
            .map((r) => r.amountDue),
        );

  const accruedPayroll = netCredit(linesAsOf, ["2100"]);
  const accruedExpenses = netCredit(linesAsOf, ["2200", "2300"]);
  const totalLiabilities = roundMoney(accruedPayroll + accruedExpenses);
  const commonStock = netCredit(linesAsOf, ["3000"]);

  // Retained earnings = cumulative NI as-of (all periods through asOf)
  const cumulativeLines = linesAsOf;
  const cumulativeRevenue = netCredit(cumulativeLines, ["4000", "4100"]);
  const cumulativeLabor = netDebit(cumulativeLines, ["5100"]);
  const cumulativeOpEx = roundMoney(
    netDebit(cumulativeLines, ["5200", "5300", "6100", "6200", "6300", "6900"]),
  );
  const endingRetainedEarnings = computeOperatingIncome(
    cumulativeRevenue,
    cumulativeLabor,
    cumulativeOpEx,
  );
  const beginningRetainedEarnings = roundMoney(
    endingRetainedEarnings - netIncome,
  );

  const totalAssets = roundMoney(endingCash + accountsReceivable);
  const totalEquity = roundMoney(commonStock + endingRetainedEarnings);
  const totalLiabilitiesAndEquity = roundMoney(
    totalLiabilities + totalEquity,
  );

  // If client filter emptied GL revenue, fall back to ops for that client so reports aren't blank.
  if (sourceIds && revenue === 0 && directLabor === 0) {
    const invoices = await getInvoices();
    const expenses = await getExpenses();
    const recognizedRevenue = sumMoney(
      invoices
        .filter(
          (i) =>
            isRecognizedInvoice(i.status) &&
            matchesClient(i.clientId, filters.client),
        )
        .map((i) => i.amount),
    );
    const placementExp = sumMoney(
      expenses
        .filter(
          (e) =>
            isRecognizedExpense(e.status) &&
            matchesClient(e.clientId, filters.client),
        )
        .map((e) => e.amount),
    );
    return {
      revenue: recognizedRevenue,
      directLabor: 0,
      placementExpenses: placementExp,
      operatingExpenses: 0,
      totalOperatingCosts: placementExp,
      grossProfit: recognizedRevenue,
      netIncome: roundMoney(recognizedRevenue - placementExp),
      collections: 0,
      accountsReceivable,
      cashFromCustomers: 0,
      cashPaidToEmployees: 0,
      cashPaidForExpenses: 0,
      netCashFromOperating: 0,
      netCashFromInvesting: 0,
      netCashFromFinancing: 0,
      netChangeInCash: 0,
      beginningCash: 0,
      endingCash: 0,
      totalAssets: accountsReceivable,
      accruedPayroll: 0,
      accruedExpenses: 0,
      totalLiabilities: 0,
      beginningRetainedEarnings: 0,
      endingRetainedEarnings: roundMoney(recognizedRevenue - placementExp),
      commonStock: 0,
      totalEquity: roundMoney(recognizedRevenue - placementExp),
      totalLiabilitiesAndEquity: roundMoney(recognizedRevenue - placementExp),
    };
  }

  return {
    revenue,
    directLabor,
    placementExpenses,
    operatingExpenses,
    totalOperatingCosts,
    grossProfit,
    netIncome,
    collections,
    accountsReceivable,
    cashFromCustomers: collections,
    cashPaidToEmployees: cashPaidEmployees,
    cashPaidForExpenses: cashPaidExpenses,
    netCashFromOperating,
    netCashFromInvesting,
    netCashFromFinancing,
    netChangeInCash,
    beginningCash,
    endingCash,
    totalAssets,
    accruedPayroll,
    accruedExpenses,
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
    "From posted journal entries (revenue, payroll accruals, and expenses).",
    [
      { label: "Revenue", value: money(f.revenue) },
      { label: "Gross profit", value: money(f.grossProfit) },
      { label: "Net income", value: money(f.netIncome) },
    ],
    [
      line("r1", "Revenue", "Staffing revenue (posted)", f.revenue),
      line("r2", "Revenue", "Total revenue", f.revenue),
      line("c1", "Cost of services", "Direct labor (payroll accruals)", f.directLabor),
      line("c2", "Cost of services", "Total cost of services", f.directLabor),
      line("g1", "Gross profit", "Gross profit", f.grossProfit),
      line("o1", "Operating expenses", "Placement expenses", f.placementExpenses),
      line("o2", "Operating expenses", "Operating expenses", f.operatingExpenses),
      line("o3", "Operating expenses", "Total operating expenses", f.totalOperatingCosts),
      line("n1", "Net income", "Operating income / net income", f.netIncome),
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
    "From posted journal entries (cash, AR, accruals, and equity).",
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
      line("l2", "Liabilities", "Accrued expenses", f.accruedExpenses),
      line("l3", "Liabilities", "Total liabilities", f.totalLiabilities),
      line("e1", "Equity", "Owner equity / common stock", f.commonStock),
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
    "Direct-method cash flows from posted cash journal lines (collections and cash expenses).",
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
        "Cash paid to employees",
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
