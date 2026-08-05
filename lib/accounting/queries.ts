import { createClient } from "@/lib/supabase/server";
import {
  daysBetween,
  dueDateFromPeriodEnd,
  invoiceDisplayStatus,
  money,
} from "@/lib/accounting/format";
import {
  computeGrossMarginPercent,
  computeGrossProfit,
  computeOperatingIncome,
  computeTempMarginPercent,
  computeTempMarginPerHour,
  computeTimesheetBillAmount,
  computeTimesheetGrossPay,
  isApprovedTimesheet,
  isAtRiskMargin,
  isCompletedPayment,
  isCurrentCalendarMonth,
  isOpenReceivable,
  isRecognizedExpense,
  isRecognizedInvoice,
  lineItemsBalance,
  netAmountDue,
  roundMoney,
  sumMoney,
  yearMonth,
} from "@/lib/accounting/calculations";
import type {
  ExpenseCategory,
  ExpenseStatus,
  InvoiceStatus,
  PlacementStatus,
  PlacementType,
} from "@/lib/types/database";

type Named = { name: string };
type EmpName = { first_name: string; last_name: string };

function asOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function getClients() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("id, name, billing_email, industry, status")
    .order("name");
  return data ?? [];
}

export async function getInvoices() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select(
      "id, client_id, placement_id, period_start, period_end, amount, status, created_at, clients(name), placements(placement_type)",
    )
    .order("period_end", { ascending: false });

  return (data ?? []).map((row) => {
    const client = asOne(row.clients as Named | Named[] | null);
    return {
      id: row.id as string,
      clientId: row.client_id as string,
      clientName: client?.name ?? "Unknown client",
      placementId: row.placement_id as string | null,
      periodStart: row.period_start as string,
      periodEnd: row.period_end as string,
      invoiceDate: (row.created_at as string).slice(0, 10),
      dueDate: dueDateFromPeriodEnd(row.period_end as string),
      amount: Number(row.amount),
      status: row.status as InvoiceStatus,
      displayStatus: invoiceDisplayStatus(
        row.status as InvoiceStatus,
        row.period_end as string,
      ),
    };
  });
}

export async function getInvoiceById(id: string) {
  const supabase = await createClient();
  const { data: invoice } = await supabase
    .from("invoices")
    .select(
      "id, client_id, placement_id, period_start, period_end, amount, status, created_at, clients(id, name, billing_email, industry), placements(id, placement_type, bill_rate, pay_rate)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!invoice) return null;

  const [{ data: lines }, { data: payments }] = await Promise.all([
    supabase
      .from("invoice_line_items")
      .select("id, description, quantity, rate, amount, timesheet_id")
      .eq("invoice_id", id)
      .order("created_at"),
    supabase
      .from("payments")
      .select("id, amount, payment_date, status")
      .eq("invoice_id", id)
      .order("payment_date", { ascending: false }),
  ]);

  const client = asOne(
    invoice.clients as
      | {
          id: string;
          name: string;
          billing_email: string | null;
          industry: string | null;
        }
      | {
          id: string;
          name: string;
          billing_email: string | null;
          industry: string | null;
        }[]
      | null,
  );

  return {
    id: invoice.id as string,
    amount: Number(invoice.amount),
    status: invoice.status as InvoiceStatus,
    displayStatus: invoiceDisplayStatus(
      invoice.status as InvoiceStatus,
      invoice.period_end as string,
    ),
    periodStart: invoice.period_start as string,
    periodEnd: invoice.period_end as string,
    invoiceDate: (invoice.created_at as string).slice(0, 10),
    dueDate: dueDateFromPeriodEnd(invoice.period_end as string),
    client,
    placement: asOne(
      invoice.placements as
        | {
            id: string;
            placement_type: PlacementType;
            bill_rate: number | null;
            pay_rate: number | null;
          }
        | {
            id: string;
            placement_type: PlacementType;
            bill_rate: number | null;
            pay_rate: number | null;
          }[]
        | null,
    ),
    lineItems: (lines ?? []).map((l) => ({
      id: l.id as string,
      description: l.description as string,
      quantity: Number(l.quantity),
      rate: Number(l.rate),
      amount: Number(l.amount),
    })),
    payments: (payments ?? []).map((p) => ({
      id: p.id as string,
      amount: Number(p.amount),
      paymentDate: p.payment_date as string,
      status: p.status as string,
    })),
    lineBalance: lineItemsBalance(
      Number(invoice.amount),
      (lines ?? []).map((l) => Number(l.amount)),
    ),
    paymentsApplied: sumMoney(
      (payments ?? [])
        .filter((p) => isCompletedPayment(p.status as string))
        .map((p) => Number(p.amount)),
    ),
  };
}

export async function getPayrollRows() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("timesheets")
    .select(
      "id, week_ending_date, hours_regular, hours_overtime, status, placements(id, pay_rate, bill_rate, clients(name), employees(first_name, last_name))",
    )
    .order("week_ending_date", { ascending: false });

  return (data ?? []).map((row) => {
    const placement = asOne(
      row.placements as
        | {
            id: string;
            pay_rate: number | null;
            bill_rate: number | null;
            clients: Named | Named[] | null;
            employees: EmpName | EmpName[] | null;
          }
        | {
            id: string;
            pay_rate: number | null;
            bill_rate: number | null;
            clients: Named | Named[] | null;
            employees: EmpName | EmpName[] | null;
          }[]
        | null,
    );
    const client = asOne(placement?.clients ?? null);
    const employee = asOne(placement?.employees ?? null);
    const hoursRegular = Number(row.hours_regular);
    const hoursOvertime = Number(row.hours_overtime);
    const hours = hoursRegular + hoursOvertime;
    const payRate = Number(placement?.pay_rate ?? 0);
    const billRate = Number(placement?.bill_rate ?? 0);
    const grossPay = computeTimesheetGrossPay(
      hoursRegular,
      hoursOvertime,
      payRate,
    );
    const billAmount = computeTimesheetBillAmount(
      hoursRegular,
      hoursOvertime,
      billRate,
    );

    return {
      id: row.id as string,
      employeeName: employee
        ? `${employee.first_name} ${employee.last_name}`
        : "Unknown",
      assignment: client?.name ?? "Unassigned",
      weekEnding: row.week_ending_date as string,
      hoursWorked: hours,
      hoursRegular,
      hoursOvertime,
      payRate,
      billRate,
      grossPay,
      billAmount,
      status: row.status as string,
    };
  });
}

export async function getContracts() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("placements")
    .select(
      "id, placement_type, bill_rate, pay_rate, placement_fee, guarantee_end_date, start_date, end_date, status, clients(name), employees(first_name, last_name)",
    )
    .order("start_date", { ascending: false });

  return (data ?? []).map((row) => {
    const client = asOne(row.clients as Named | Named[] | null);
    const employee = asOne(row.employees as EmpName | EmpName[] | null);
    return {
      id: row.id as string,
      clientName: client?.name ?? "Unknown",
      employeeName: employee
        ? `${employee.first_name} ${employee.last_name}`
        : "Unknown",
      startDate: row.start_date as string,
      endDate: (row.end_date as string | null) ?? null,
      billingType: row.placement_type as PlacementType,
      billRate: row.bill_rate != null ? Number(row.bill_rate) : null,
      payRate: row.pay_rate != null ? Number(row.pay_rate) : null,
      placementFee:
        row.placement_fee != null ? Number(row.placement_fee) : null,
      guaranteeEndDate: row.guarantee_end_date as string | null,
      status: row.status as PlacementStatus,
    };
  });
}

export async function getContractById(id: string) {
  const supabase = await createClient();
  const { data: placement } = await supabase
    .from("placements")
    .select(
      "id, placement_type, bill_rate, pay_rate, placement_fee, guarantee_end_date, start_date, end_date, status, clients(id, name, billing_email), employees(id, first_name, last_name, email)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!placement) return null;

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, amount, status, period_start, period_end")
    .eq("placement_id", id)
    .order("period_end", { ascending: false });

  const { data: recruiters } = await supabase
    .from("users")
    .select("name, email")
    .eq("role", "recruiter")
    .limit(1);

  return {
    id: placement.id as string,
    billingType: placement.placement_type as PlacementType,
    billRate:
      placement.bill_rate != null ? Number(placement.bill_rate) : null,
    payRate: placement.pay_rate != null ? Number(placement.pay_rate) : null,
    placementFee:
      placement.placement_fee != null
        ? Number(placement.placement_fee)
        : null,
    guaranteeEndDate: placement.guarantee_end_date as string | null,
    startDate: placement.start_date as string,
    endDate: placement.end_date as string | null,
    status: placement.status as PlacementStatus,
    client: asOne(
      placement.clients as
        | { id: string; name: string; billing_email: string | null }
        | { id: string; name: string; billing_email: string | null }[]
        | null,
    ),
    employee: asOne(
      placement.employees as
        | {
            id: string;
            first_name: string;
            last_name: string;
            email: string;
          }
        | {
            id: string;
            first_name: string;
            last_name: string;
            email: string;
          }[]
        | null,
    ),
    invoices: (invoices ?? []).map((i) => ({
      id: i.id as string,
      amount: Number(i.amount),
      status: i.status as InvoiceStatus,
      periodStart: i.period_start as string,
      periodEnd: i.period_end as string,
    })),
    recruiter: recruiters?.[0] ?? null,
  };
}

export async function getExpenses() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select(
      "id, expense_date, category, client_id, placement_id, amount, status, notes, clients(name), placements(id)",
    )
    .order("expense_date", { ascending: false });

  if (error) {
    console.error("expenses query", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const client = asOne(row.clients as Named | Named[] | null);
    return {
      id: row.id as string,
      expenseDate: row.expense_date as string,
      category: row.category as ExpenseCategory,
      clientId: row.client_id as string | null,
      clientName: client?.name ?? "—",
      placementId: row.placement_id as string | null,
      amount: Number(row.amount),
      status: row.status as ExpenseStatus,
      notes: row.notes as string | null,
    };
  });
}

export async function getAccountsReceivable() {
  const invoices = await getInvoices();
  const supabase = await createClient();
  const { data: payments } = await supabase
    .from("payments")
    .select("invoice_id, amount, status");

  const paidByInvoice = new Map<string, number>();
  for (const p of payments ?? []) {
    if (!isCompletedPayment(p.status as string)) continue;
    paidByInvoice.set(
      p.invoice_id as string,
      roundMoney(
        (paidByInvoice.get(p.invoice_id as string) ?? 0) + Number(p.amount),
      ),
    );
  }

  const open = invoices.filter((i) => isOpenReceivable(i.status));
  const rows = open
    .map((inv) => {
      const paid = paidByInvoice.get(inv.id) ?? 0;
      const amountDue = netAmountDue(inv.amount, paid);
      return {
        ...inv,
        amountDue,
        paymentsApplied: paid,
        daysOutstanding: daysBetween(inv.dueDate),
        paymentStatus: inv.displayStatus,
      };
    })
    // Fully collected partials that still show open status shouldn't appear
    .filter((r) => r.amountDue > 0 || r.status === "disputed");

  const outstanding = sumMoney(rows.map((r) => r.amountDue));
  const received = sumMoney([...paidByInvoice.values()]);
  const overdueCount = rows.filter((r) => r.paymentStatus === "Overdue").length;

  return {
    summary: {
      outstanding,
      received,
      overdueCount,
    },
    rows,
  };
}

export async function getDashboardData() {
  const supabase = await createClient();
  const [invoices, payments, placements, timesheets, expenses] =
    await Promise.all([
      getInvoices(),
      supabase.from("payments").select("invoice_id, amount, status, payment_date, created_at"),
      getContracts(),
      getPayrollRows(),
      getExpenses(),
    ]);

  const recognizedInvoices = invoices.filter((i) =>
    isRecognizedInvoice(i.status),
  );
  const billedRevenue = sumMoney(recognizedInvoices.map((i) => i.amount));

  const approvedSheets = timesheets.filter((t) =>
    isApprovedTimesheet(t.status),
  );
  const earnedRevenue = sumMoney(approvedSheets.map((t) => t.billAmount));
  const directLabor = sumMoney(approvedSheets.map((t) => t.grossPay));
  const payrollThisMonth = sumMoney(
    approvedSheets
      .filter((t) => isCurrentCalendarMonth(t.weekEnding))
      .map((t) => t.grossPay),
  );

  const paidByInvoice = new Map<string, number>();
  for (const p of payments.data ?? []) {
    if (!isCompletedPayment(p.status as string)) continue;
    paidByInvoice.set(
      p.invoice_id as string,
      roundMoney(
        (paidByInvoice.get(p.invoice_id as string) ?? 0) + Number(p.amount),
      ),
    );
  }

  const outstandingInvoices = sumMoney(
    invoices
      .filter((i) => isOpenReceivable(i.status))
      .map((i) => netAmountDue(i.amount, paidByInvoice.get(i.id) ?? 0)),
  );

  const recognizedExpenses = expenses.filter((e) =>
    isRecognizedExpense(e.status),
  );
  const operatingExpenses = sumMoney(recognizedExpenses.map((e) => e.amount));
  const collected = sumMoney(
    (payments.data ?? [])
      .filter((p) => isCompletedPayment(p.status as string))
      .map((p) => Number(p.amount)),
  );

  const grossProfit = computeGrossProfit(billedRevenue, directLabor);
  const operatingIncome = computeOperatingIncome(
    billedRevenue,
    directLabor,
    operatingExpenses,
  );
  const activeContracts = placements.filter((p) => p.status === "active").length;

  const byMonth = new Map<string, number>();
  for (const inv of recognizedInvoices) {
    const key = yearMonth(inv.periodEnd);
    byMonth.set(key, roundMoney((byMonth.get(key) ?? 0) + inv.amount));
  }
  const revenueByMonth = [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({ month, amount }));

  const statusCounts: Record<string, number> = {
    Paid: 0,
    Pending: 0,
    Overdue: 0,
    Disputed: 0,
  };
  for (const inv of invoices) {
    if (inv.status === "draft") continue;
    if (inv.status === "paid") statusCounts.Paid += 1;
    else if (inv.status === "disputed") statusCounts.Disputed += 1;
    else if (inv.displayStatus === "Overdue") statusCounts.Overdue += 1;
    else if (inv.status === "sent" || inv.status === "partial")
      statusCounts.Pending += 1;
  }

  const activity = [
    ...recognizedInvoices.slice(0, 4).map((i) => ({
      id: `inv-${i.id}`,
      label: `Invoice ${i.displayStatus.toLowerCase()} · ${i.clientName}`,
      detail: money(i.amount),
      at: i.invoiceDate,
    })),
    ...(payments.data ?? []).slice(0, 3).map((p, idx) => ({
      id: `pay-${idx}`,
      label: isCompletedPayment(p.status as string)
        ? "Payment collected"
        : "Payment pending",
      detail: money(Number(p.amount)),
      at: (p.payment_date as string) ?? "",
    })),
  ].slice(0, 8);

  return {
    cards: {
      earnedRevenue,
      billedRevenue,
      totalRevenue: billedRevenue,
      outstandingInvoices,
      payrollThisMonth,
      directLabor,
      activeContracts,
      totalExpenses: operatingExpenses,
      grossProfit,
      operatingIncome,
      collected,
      grossMarginPercent: computeGrossMarginPercent(billedRevenue, directLabor),
    },
    revenueByMonth,
    statusCounts,
    activity,
  };
}

export async function getProfitabilityData() {
  const [contracts, invoices, expenses, payroll] = await Promise.all([
    getContracts(),
    getInvoices(),
    getExpenses(),
    getPayrollRows(),
  ]);

  const recognizedInvoices = invoices.filter((i) =>
    isRecognizedInvoice(i.status),
  );
  const approvedPayroll = payroll.filter((r) =>
    isApprovedTimesheet(r.status),
  );
  const recognizedExpenses = expenses.filter((e) =>
    isRecognizedExpense(e.status),
  );

  const revenueByClient = new Map<string, number>();
  for (const inv of recognizedInvoices) {
    revenueByClient.set(
      inv.clientName,
      roundMoney((revenueByClient.get(inv.clientName) ?? 0) + inv.amount),
    );
  }

  const costByClient = new Map<string, number>();
  for (const row of approvedPayroll) {
    costByClient.set(
      row.assignment,
      roundMoney((costByClient.get(row.assignment) ?? 0) + row.grossPay),
    );
  }

  const profitByClient = [...revenueByClient.entries()].map(
    ([client, revenue]) => {
      const cost = costByClient.get(client) ?? 0;
      return {
        name: client,
        revenue,
        cost,
        profit: roundMoney(revenue - cost),
      };
    },
  );

  const profitByPlacement = contracts.map((c) => {
    const related = recognizedInvoices.filter((i) => i.placementId === c.id);
    const revenue = sumMoney(related.map((i) => i.amount));
    const marginPerHour = computeTempMarginPerHour(c.billRate, c.payRate) ?? 0;
    const marginPercent = computeTempMarginPercent(c.billRate, c.payRate);
    return {
      id: c.id,
      label: `${c.clientName} · ${c.employeeName}`,
      revenue,
      marginPerHour,
      marginPercent,
      isCritical: isAtRiskMargin(marginPercent),
      fee: c.placementFee ?? 0,
      billingType: c.billingType,
    };
  });

  const billedRevenue = sumMoney(recognizedInvoices.map((i) => i.amount));
  const directLabor = sumMoney(approvedPayroll.map((r) => r.grossPay));
  const operatingExpenses = sumMoney(recognizedExpenses.map((e) => e.amount));
  const grossProfit = computeGrossProfit(billedRevenue, directLabor);
  const operatingIncome = computeOperatingIncome(
    billedRevenue,
    directLabor,
    operatingExpenses,
  );
  const grossMargin = computeGrossMarginPercent(billedRevenue, directLabor);

  const byMonth = new Map<
    string,
    { revenue: number; labor: number; opex: number }
  >();
  for (const inv of recognizedInvoices) {
    const key = yearMonth(inv.periodEnd);
    const cur = byMonth.get(key) ?? { revenue: 0, labor: 0, opex: 0 };
    cur.revenue = roundMoney(cur.revenue + inv.amount);
    byMonth.set(key, cur);
  }
  for (const row of approvedPayroll) {
    const key = yearMonth(row.weekEnding);
    const cur = byMonth.get(key) ?? { revenue: 0, labor: 0, opex: 0 };
    cur.labor = roundMoney(cur.labor + row.grossPay);
    byMonth.set(key, cur);
  }
  for (const exp of recognizedExpenses) {
    const key = yearMonth(exp.expenseDate);
    const cur = byMonth.get(key) ?? { revenue: 0, labor: 0, opex: 0 };
    cur.opex = roundMoney(cur.opex + exp.amount);
    byMonth.set(key, cur);
  }

  const monthly = [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({
      month,
      revenue: v.revenue,
      expenses: roundMoney(v.labor + v.opex),
      profit: roundMoney(v.revenue - v.labor - v.opex),
    }));

  // Recruiter profitability requires placement attribution data we do not store;
  // show agency-level gross profit once rather than inventing allocations.
  const profitByRecruiter = [
    {
      name: "Agency (unallocated)",
      profit: grossProfit,
    },
  ];

  return {
    profitByClient,
    profitByPlacement,
    profitByRecruiter,
    totals: {
      revenue: billedRevenue,
      directLabor,
      operatingExpenses,
      expenses: roundMoney(directLabor + operatingExpenses),
      grossProfit,
      operatingIncome,
      grossMargin,
      profit: operatingIncome,
    },
    monthly,
  };
}
