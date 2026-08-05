import {
  getAccountsReceivable,
  getContracts,
  getExpenses,
  getInvoices,
  getOperatingExpenses,
  getTimesheets,
} from "@/lib/accounting/queries";
import {
  expenseTypeLabel,
  money,
  moneyExact,
  operatingExpenseCategoryLabel,
  shortId,
} from "@/lib/accounting/format";
import {
  isApprovedTimesheet,
  isRecognizedInvoice,
  roundMoney,
  sumMoney,
  yearMonth,
} from "@/lib/accounting/calculations";
import {
  buildBalanceSheetReport,
  buildCashFlowsReport,
  buildIncomeStatementReport,
} from "@/lib/accounting/drafted-statements";

export const REPORT_IDS = [
  "revenue",
  "payroll",
  "aging",
  "profitability",
  "contract-revenue",
  "expense",
  "cash-flows",
  "income-statement",
  "balance-sheet",
] as const;

export type ReportId = (typeof REPORT_IDS)[number];

export type ReportFilters = {
  from?: string | null;
  to?: string | null;
  client?: string | null;
};

export type ReportDefinition = {
  id: ReportId;
  title: string;
  description: string;
};

export const REPORTS: ReportDefinition[] = [
  {
    id: "revenue",
    title: "Revenue Report",
    description: "Invoice revenue by period and client.",
  },
  {
    id: "payroll",
    title: "Payroll Report",
    description: "Gross pay from timesheets and pay rates.",
  },
  {
    id: "aging",
    title: "Invoice Aging Report",
    description: "Open invoices by days outstanding.",
  },
  {
    id: "profitability",
    title: "Profitability Report",
    description: "Margin by client and placement.",
  },
  {
    id: "contract-revenue",
    title: "Contract Revenue Report",
    description: "Revenue attributed to placements.",
  },
  {
    id: "expense",
    title: "Expense Report",
    description: "Placement and operating expenses by category.",
  },
];

export const DRAFTED_STATEMENTS: ReportDefinition[] = [
  {
    id: "cash-flows",
    title: "Statement of Cash Flows",
    description:
      "Drafted direct-method cash flows from collections, payroll, and expenses.",
  },
  {
    id: "income-statement",
    title: "Income Statement",
    description:
      "Drafted staffing P&L from recognized invoices, approved labor, and expenses.",
  },
  {
    id: "balance-sheet",
    title: "Balance Sheet",
    description:
      "Drafted position from cash collections, open AR, and equity plugs.",
  },
];

export function isReportId(value: string): value is ReportId {
  return (REPORT_IDS as readonly string[]).includes(value);
}

export function getReportDefinition(id: ReportId): ReportDefinition {
  return (
    REPORTS.find((r) => r.id === id) ??
    DRAFTED_STATEMENTS.find((r) => r.id === id)!
  );
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

export type ReportColumn = { key: string; header: string };
export type ReportRow = { id: string; cells: Record<string, string> };

export type ReportPreview = {
  id: ReportId;
  title: string;
  description: string;
  summary: { label: string; value: string }[];
  columns: ReportColumn[];
  rows: ReportRow[];
};

export function reportPreviewHref(id: ReportId): string {
  return `/accounting/reports/${id}`;
}

export async function getReportPreview(
  id: ReportId,
  filters: ReportFilters = {},
): Promise<ReportPreview> {
  switch (id) {
    case "revenue":
      return buildRevenueReport(filters);
    case "payroll":
      return buildPayrollReport(filters);
    case "aging":
      return buildAgingReport(filters);
    case "profitability":
      return buildProfitabilityReport(filters);
    case "contract-revenue":
      return buildContractRevenueReport(filters);
    case "expense":
      return buildExpenseReport(filters);
    case "cash-flows":
      return buildCashFlowsReport(filters);
    case "income-statement":
      return buildIncomeStatementReport(filters);
    case "balance-sheet":
      return buildBalanceSheetReport(filters);
  }
}

async function buildRevenueReport(filters: ReportFilters): Promise<ReportPreview> {
  const invoices = (await getInvoices()).filter(
    (i) =>
      isRecognizedInvoice(i.status) &&
      matchesClient(i.clientId, filters.client) &&
      inDateRange(i.periodEnd, filters.from, filters.to),
  );

  const byMonthClient = new Map<string, { month: string; client: string; amount: number; count: number }>();
  for (const inv of invoices) {
    const month = yearMonth(inv.periodEnd);
    const key = `${month}|${inv.clientName}`;
    const cur = byMonthClient.get(key) ?? {
      month,
      client: inv.clientName,
      amount: 0,
      count: 0,
    };
    cur.amount = roundMoney(cur.amount + inv.amount);
    cur.count += 1;
    byMonthClient.set(key, cur);
  }

  const aggregates = [...byMonthClient.values()].sort((a, b) =>
    a.month === b.month
      ? a.client.localeCompare(b.client)
      : a.month.localeCompare(b.month),
  );

  const total = sumMoney(invoices.map((i) => i.amount));

  return {
    id: "revenue",
    title: "Revenue Report",
    description: "Invoice revenue by period and client.",
    summary: [
      { label: "Billed revenue", value: money(total) },
      { label: "Invoices", value: String(invoices.length) },
      { label: "Client-periods", value: String(aggregates.length) },
    ],
    columns: [
      { key: "month", header: "Period" },
      { key: "client", header: "Client" },
      { key: "invoices", header: "Invoices" },
      { key: "amount", header: "Revenue" },
    ],
    rows: aggregates.map((r, idx) => ({
      id: `${r.month}-${r.client}-${idx}`,
      cells: {
        month: r.month,
        client: r.client,
        invoices: String(r.count),
        amount: moneyExact(r.amount),
      },
    })),
  };
}

async function buildPayrollReport(filters: ReportFilters): Promise<ReportPreview> {
  const sheets = (await getTimesheets()).filter(
    (t) =>
      isApprovedTimesheet(t.status) &&
      matchesClient(t.clientId, filters.client) &&
      inDateRange(t.weekEnding, filters.from, filters.to),
  );

  const totalGross = sumMoney(sheets.map((s) => s.grossPay));
  const totalHours = sumMoney(sheets.map((s) => s.hoursWorked));

  return {
    id: "payroll",
    title: "Payroll Report",
    description: "Gross pay from approved timesheets and pay rates.",
    summary: [
      { label: "Gross pay", value: money(totalGross) },
      { label: "Hours", value: String(totalHours) },
      { label: "Timesheets", value: String(sheets.length) },
    ],
    columns: [
      { key: "week", header: "Week Ending" },
      { key: "employee", header: "Employee" },
      { key: "client", header: "Assignment" },
      { key: "hours", header: "Hours" },
      { key: "rate", header: "Pay Rate" },
      { key: "gross", header: "Gross Pay" },
    ],
    rows: sheets.map((s) => ({
      id: s.id,
      cells: {
        week: s.weekEnding,
        employee: s.employeeName,
        client: s.assignment,
        hours: String(s.hoursWorked),
        rate: moneyExact(s.payRate),
        gross: moneyExact(s.grossPay),
      },
    })),
  };
}

async function buildAgingReport(filters: ReportFilters): Promise<ReportPreview> {
  const ar = await getAccountsReceivable();
  const rows = ar.rows.filter(
    (r) =>
      matchesClient(r.clientId, filters.client) &&
      inDateRange(r.dueDate, filters.from, filters.to),
  );

  const bucket = (days: number) => {
    if (days <= 0) return "Current";
    if (days <= 30) return "1–30";
    if (days <= 60) return "31–60";
    if (days <= 90) return "61–90";
    return "90+";
  };

  const outstanding = sumMoney(rows.map((r) => r.amountDue));

  return {
    id: "aging",
    title: "Invoice Aging Report",
    description: "Open invoices by days outstanding.",
    summary: [
      { label: "Outstanding", value: money(outstanding) },
      { label: "Open invoices", value: String(rows.length) },
      {
        label: "Overdue",
        value: String(rows.filter((r) => r.daysOutstanding > 0).length),
      },
    ],
    columns: [
      { key: "invoice", header: "Invoice" },
      { key: "client", header: "Client" },
      { key: "due", header: "Due Date" },
      { key: "days", header: "Days Out" },
      { key: "bucket", header: "Bucket" },
      { key: "dueAmount", header: "Amount Due" },
      { key: "status", header: "Status" },
    ],
    rows: rows
      .slice()
      .sort((a, b) => b.daysOutstanding - a.daysOutstanding)
      .map((r) => ({
        id: r.id,
        cells: {
          invoice: shortId(r.id),
          client: r.clientName,
          due: r.dueDate,
          days: String(r.daysOutstanding),
          bucket: bucket(r.daysOutstanding),
          dueAmount: moneyExact(r.amountDue),
          status: r.paymentStatus,
        },
      })),
  };
}

async function buildProfitabilityReport(
  filters: ReportFilters,
): Promise<ReportPreview> {
  const [invoices, timesheets, contracts] = await Promise.all([
    getInvoices(),
    getTimesheets(),
    getContracts(),
  ]);

  const recognized = invoices.filter(
    (i) =>
      isRecognizedInvoice(i.status) &&
      matchesClient(i.clientId, filters.client) &&
      inDateRange(i.periodEnd, filters.from, filters.to),
  );
  const approved = timesheets.filter(
    (t) =>
      isApprovedTimesheet(t.status) &&
      matchesClient(t.clientId, filters.client) &&
      inDateRange(t.weekEnding, filters.from, filters.to),
  );

  const revenueByClient = new Map<string, number>();
  for (const inv of recognized) {
    revenueByClient.set(
      inv.clientName,
      roundMoney((revenueByClient.get(inv.clientName) ?? 0) + inv.amount),
    );
  }
  const costByClient = new Map<string, number>();
  for (const t of approved) {
    costByClient.set(
      t.assignment,
      roundMoney((costByClient.get(t.assignment) ?? 0) + t.grossPay),
    );
  }

  const clients = new Set([
    ...revenueByClient.keys(),
    ...costByClient.keys(),
  ]);

  const rows = [...clients]
    .sort()
    .map((name) => {
      const revenue = revenueByClient.get(name) ?? 0;
      const cost = costByClient.get(name) ?? 0;
      const profit = roundMoney(revenue - cost);
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
      return { name, revenue, cost, profit, margin };
    });

  const totalRevenue = sumMoney(rows.map((r) => r.revenue));
  const totalCost = sumMoney(rows.map((r) => r.cost));
  const totalProfit = roundMoney(totalRevenue - totalCost);
  const placementCount = contracts.filter((c) =>
    matchesClient(c.clientId, filters.client),
  ).length;

  return {
    id: "profitability",
    title: "Profitability Report",
    description: "Margin by client (billed revenue − direct labor).",
    summary: [
      { label: "Revenue", value: money(totalRevenue) },
      { label: "Direct labor", value: money(totalCost) },
      { label: "Gross profit", value: money(totalProfit) },
      { label: "Placements in scope", value: String(placementCount) },
    ],
    columns: [
      { key: "client", header: "Client" },
      { key: "revenue", header: "Revenue" },
      { key: "cost", header: "Direct Labor" },
      { key: "profit", header: "Gross Profit" },
      { key: "margin", header: "Margin %" },
    ],
    rows: rows.map((r) => ({
      id: r.name,
      cells: {
        client: r.name,
        revenue: moneyExact(r.revenue),
        cost: moneyExact(r.cost),
        profit: moneyExact(r.profit),
        margin: `${r.margin.toFixed(1)}%`,
      },
    })),
  };
}

async function buildContractRevenueReport(
  filters: ReportFilters,
): Promise<ReportPreview> {
  const [contracts, invoices] = await Promise.all([
    getContracts(),
    getInvoices(),
  ]);

  const recognized = invoices.filter(
    (i) =>
      isRecognizedInvoice(i.status) &&
      matchesClient(i.clientId, filters.client) &&
      inDateRange(i.periodEnd, filters.from, filters.to),
  );

  const hasDateFilter = Boolean(filters.from || filters.to);
  const rows = contracts
    .filter((c) => matchesClient(c.clientId, filters.client))
    .map((c) => {
      const related = recognized.filter((i) => i.placementId === c.id);
      const revenue = sumMoney(related.map((i) => i.amount));
      return {
        id: c.id,
        client: c.clientName,
        employee: c.employeeName,
        status: c.status,
        invoices: related.length,
        revenue,
      };
    })
    .filter((r) => (hasDateFilter ? r.revenue > 0 : true))
    .sort((a, b) => b.revenue - a.revenue);

  const total = sumMoney(rows.map((r) => r.revenue));

  return {
    id: "contract-revenue",
    title: "Contract Revenue Report",
    description: "Revenue attributed to placements.",
    summary: [
      { label: "Contract revenue", value: money(total) },
      { label: "Contracts", value: String(rows.length) },
    ],
    columns: [
      { key: "contract", header: "Contract" },
      { key: "client", header: "Client" },
      { key: "employee", header: "Employee" },
      { key: "status", header: "Status" },
      { key: "invoices", header: "Invoices" },
      { key: "revenue", header: "Revenue" },
    ],
    rows: rows.map((r) => ({
      id: r.id,
      cells: {
        contract: shortId(r.id),
        client: r.client,
        employee: r.employee,
        status: r.status,
        invoices: String(r.invoices),
        revenue: moneyExact(r.revenue),
      },
    })),
  };
}

async function buildExpenseReport(filters: ReportFilters): Promise<ReportPreview> {
  const [placement, operating] = await Promise.all([
    getExpenses(),
    getOperatingExpenses(),
  ]);

  const placementRows = placement
    .filter(
      (e) =>
        matchesClient(e.clientId, filters.client) &&
        inDateRange(e.expenseDate, filters.from, filters.to),
    )
    .map((e) => ({
      id: `p-${e.id}`,
      kind: "Placement",
      category: expenseTypeLabel(e.expenseType),
      detail: `${e.clientName} · ${e.description}`,
      date: e.expenseDate,
      amount: e.amount,
    }));

  const operatingRows = (
    !filters.client || filters.client === "all"
      ? operating.filter((e) =>
          inDateRange(e.expenseDate, filters.from, filters.to),
        )
      : []
  ).map((e) => ({
    id: `o-${e.id}`,
    kind: "Operating",
    category: operatingExpenseCategoryLabel(e.category),
    detail: e.description,
    date: e.expenseDate,
    amount: e.amount,
  }));

  const rows = [...placementRows, ...operatingRows].sort((a, b) =>
    b.date.localeCompare(a.date),
  );
  const total = sumMoney(rows.map((r) => r.amount));

  return {
    id: "expense",
    title: "Expense Report",
    description: "Placement and operating expenses by category.",
    summary: [
      { label: "Total expenses", value: money(total) },
      { label: "Placement", value: money(sumMoney(placementRows.map((r) => r.amount))) },
      { label: "Operating", value: money(sumMoney(operatingRows.map((r) => r.amount))) },
    ],
    columns: [
      { key: "date", header: "Date" },
      { key: "kind", header: "Kind" },
      { key: "category", header: "Category" },
      { key: "detail", header: "Detail" },
      { key: "amount", header: "Amount" },
    ],
    rows: rows.map((r) => ({
      id: r.id,
      cells: {
        date: r.date,
        kind: r.kind,
        category: r.category,
        detail: r.detail,
        amount: moneyExact(r.amount),
      },
    })),
  };
}
