import {
  buildContractAuditEvent,
  buildExpenseAuditEvent,
  buildInvoiceAuditEvent,
  buildJournalAuditEvent,
  buildPaymentAuditEvent,
  buildTimesheetAuditEvent,
  mergeAuditEvents,
} from "@/lib/accounting/audit";
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
  isWithinLastDays,
  isOpenReceivable,
  isRecognizedInvoice,
  lineItemsBalance,
  netAmountDue,
  roundMoney,
  sumMoney,
  yearMonth,
} from "@/lib/accounting/calculations";
import { isPayrollOperatingCategory } from "@/lib/accounting/payroll-expenses";
import type {
  ExpenseStatus,
  ExpenseType,
  InvoiceStatus,
  JournalEntrySourceType,
  JournalEntryStatus,
  OperatingExpenseCategory,
  PlacementStatus,
  PlacementType,
} from "@/lib/types/database";

type Named = { name: string };
type EmpName = { id?: string; first_name: string; last_name: string };

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
      .select("id, amount, payment_date, status, created_at")
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

  const placement = asOne(
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
  );

  return {
    id: invoice.id as string,
    clientId: invoice.client_id as string,
    placementId: (invoice.placement_id as string | null) ?? placement?.id ?? null,
    amount: Number(invoice.amount),
    status: invoice.status as InvoiceStatus,
    displayStatus: invoiceDisplayStatus(
      invoice.status as InvoiceStatus,
      invoice.period_end as string,
    ),
    periodStart: invoice.period_start as string,
    periodEnd: invoice.period_end as string,
    invoiceDate: (invoice.created_at as string).slice(0, 10),
    createdAt: invoice.created_at as string,
    dueDate: dueDateFromPeriodEnd(invoice.period_end as string),
    client,
    placement,
    lineItems: (lines ?? []).map((l) => ({
      id: l.id as string,
      description: l.description as string,
      quantity: Number(l.quantity),
      rate: Number(l.rate),
      amount: Number(l.amount),
      timesheetId: (l.timesheet_id as string | null) ?? null,
    })),
    payments: (payments ?? []).map((p) => ({
      id: p.id as string,
      amount: Number(p.amount),
      paymentDate: p.payment_date as string,
      status: p.status as string,
      createdAt: (p.created_at as string | null) ?? null,
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

/** All candidate/employee timesheets (staff-visible via RLS). */
export async function getTimesheets() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("timesheets")
    .select(
      "id, week_ending_date, hours_regular, hours_overtime, status, employer_note, created_at, placements(id, pay_rate, bill_rate, clients(id, name), employees(id, first_name, last_name, email))",
    )
    .order("week_ending_date", { ascending: false });

  return (data ?? []).map((row) => {
    const placement = asOne(
      row.placements as
        | {
            id: string;
            pay_rate: number | null;
            bill_rate: number | null;
            clients:
              | { id: string; name: string }
              | { id: string; name: string }[]
              | null;
            employees:
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
              | null;
          }
        | {
            id: string;
            pay_rate: number | null;
            bill_rate: number | null;
            clients:
              | { id: string; name: string }
              | { id: string; name: string }[]
              | null;
            employees:
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
              | null;
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
      placementId: placement?.id ?? null,
      employeeId: employee?.id ?? null,
      employeeName: employee
        ? `${employee.first_name} ${employee.last_name}`
        : "Unknown",
      employeeEmail: employee?.email ?? null,
      clientId: client?.id ?? null,
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
      employerNote: (row.employer_note as string | null) ?? null,
      createdAt: (row.created_at as string | null) ?? null,
    };
  });
}

/** @deprecated Prefer getTimesheets — same rows with payroll fields. */
export async function getPayrollRows() {
  return getTimesheets();
}

export async function getTimesheetById(id: string) {
  const rows = await getTimesheets();
  return rows.find((r) => r.id === id) ?? null;
}

export async function getAccountingEmployeeById(id: string) {
  const supabase = await createClient();
  const { data: employee } = await supabase
    .from("employees")
    .select(
      "id, first_name, last_name, email, phone, employment_type, status, certifications, resume_url, emergency_contact_name, emergency_contact_phone, created_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (!employee) return null;

  const [placements, timesheets] = await Promise.all([
    getContracts(),
    getTimesheets(),
  ]);

  const employeePlacements = placements.filter((p) => p.employeeId === id);
  const employeeTimesheets = timesheets.filter((t) => t.employeeId === id);
  const name = `${employee.first_name} ${employee.last_name}`;

  return {
    id: employee.id as string,
    firstName: employee.first_name as string,
    lastName: employee.last_name as string,
    name,
    email: employee.email as string,
    phone: (employee.phone as string | null) ?? null,
    employmentType: employee.employment_type as string,
    status: employee.status as string,
    certifications: (employee.certifications as string | null) ?? null,
    resumeUrl: (employee.resume_url as string | null) ?? null,
    emergencyContactName:
      (employee.emergency_contact_name as string | null) ?? null,
    emergencyContactPhone:
      (employee.emergency_contact_phone as string | null) ?? null,
    createdAt: employee.created_at as string,
    placements: employeePlacements,
    timesheets: employeeTimesheets,
    totals: {
      hours: roundMoney(
        employeeTimesheets.reduce((s, t) => s + t.hoursWorked, 0),
      ),
      grossPay: sumMoney(employeeTimesheets.map((t) => t.grossPay)),
      billAmount: sumMoney(employeeTimesheets.map((t) => t.billAmount)),
    },
  };
}

export async function getContracts() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("placements")
    .select(
      "id, placement_type, bill_rate, pay_rate, placement_fee, guarantee_end_date, start_date, end_date, status, clients(id, name), employees(id, first_name, last_name)",
    )
    .order("start_date", { ascending: false });

  return (data ?? []).map((row) => {
    const client = asOne(
      row.clients as
        | { id: string; name: string }
        | { id: string; name: string }[]
        | null,
    );
    const employee = asOne(row.employees as EmpName | EmpName[] | null);
    return {
      id: row.id as string,
      clientId: client?.id ?? null,
      clientName: client?.name ?? "Unknown",
      employeeId: employee?.id ?? null,
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

  const [{ data: invoices }, { data: timesheets }, { data: expenses }, { data: recruiters }] =
    await Promise.all([
      supabase
        .from("invoices")
        .select("id, amount, status, period_start, period_end, created_at")
        .eq("placement_id", id)
        .order("period_end", { ascending: false }),
      supabase
        .from("timesheets")
        .select(
          "id, week_ending_date, hours_regular, hours_overtime, status, placements(pay_rate)",
        )
        .eq("placement_id", id)
        .order("week_ending_date", { ascending: false }),
      supabase
        .from("expenses")
        .select("id, expense_date, expense_type, description, amount, status")
        .eq("placement_id", id)
        .order("expense_date", { ascending: false }),
      supabase
        .from("users")
        .select("name, email")
        .eq("role", "recruiter")
        .limit(1),
    ]);

  const invoiceIds = (invoices ?? []).map((i) => i.id as string);
  const { data: payments } =
    invoiceIds.length > 0
      ? await supabase
          .from("payments")
          .select("id, invoice_id, amount, status, payment_date, created_at")
          .in("invoice_id", invoiceIds)
          .order("payment_date", { ascending: false })
      : { data: [] as never[] };

  const payRate = placement.pay_rate != null ? Number(placement.pay_rate) : 0;

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
      createdAt: i.created_at as string,
    })),
    timesheets: (timesheets ?? []).map((t) => {
      const hoursRegular = Number(t.hours_regular);
      const hoursOvertime = Number(t.hours_overtime);
      const placementPay = asOne(
        t.placements as
          | { pay_rate: number | null }
          | { pay_rate: number | null }[]
          | null,
      );
      const rate = Number(placementPay?.pay_rate ?? payRate);
      return {
        id: t.id as string,
        weekEnding: t.week_ending_date as string,
        hoursRegular,
        hoursOvertime,
        status: t.status as string,
        grossPay: computeTimesheetGrossPay(hoursRegular, hoursOvertime, rate),
      };
    }),
    expenses: (expenses ?? []).map((e) => ({
      id: e.id as string,
      expenseDate: e.expense_date as string,
      expenseType: e.expense_type as ExpenseType,
      description: e.description as string,
      amount: Number(e.amount),
      status: e.status as ExpenseStatus,
    })),
    payments: (payments ?? []).map((p) => ({
      id: p.id as string,
      invoiceId: p.invoice_id as string,
      amount: Number(p.amount),
      status: p.status as string,
      paymentDate: p.payment_date as string | null,
      createdAt: (p.created_at as string | null) ?? null,
    })),
    recruiter: recruiters?.[0] ?? null,
  };
}

/** Placement-linked direct costs (public.expenses). */
export async function getExpenses() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select(
      "id, expense_date, expense_type, description, placement_id, amount, status, placements(id, clients(id, name))",
    )
    .order("expense_date", { ascending: false });

  if (error) {
    console.error("expenses query", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const placement = asOne(
      row.placements as
        | {
            id: string;
            clients:
              | { id: string; name: string }
              | { id: string; name: string }[]
              | null;
          }
        | {
            id: string;
            clients:
              | { id: string; name: string }
              | { id: string; name: string }[]
              | null;
          }[]
        | null,
    );
    const client = asOne(placement?.clients ?? null);
    return {
      id: row.id as string,
      expenseDate: row.expense_date as string,
      expenseType: row.expense_type as ExpenseType,
      description: row.description as string,
      clientId: client?.id ?? null,
      clientName: client?.name ?? "—",
      placementId: (row.placement_id as string | null) ?? null,
      amount: Number(row.amount),
      status: row.status as ExpenseStatus,
    };
  });
}

/** Company overhead (public.operating_expenses). */
export async function getOperatingExpenses() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("operating_expenses")
    .select("id, category, description, amount, expense_date, month, status")
    .order("expense_date", { ascending: false });

  if (error) {
    console.error("operating_expenses query", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    category: row.category as OperatingExpenseCategory,
    description: row.description as string,
    amount: Number(row.amount),
    expenseDate: row.expense_date as string,
    month: row.month as string,
    status: (row.status as ExpenseStatus) ?? "approved",
  }));
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
  const [invoices, payments, placements, timesheets, operatingExpenseRows, placementExpenseRows] =
    await Promise.all([
      getInvoices(),
      supabase.from("payments").select("invoice_id, amount, status, payment_date, created_at"),
      getContracts(),
      getPayrollRows(),
      getOperatingExpenses(),
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
  const contractLaborLast30Days = sumMoney(
    approvedSheets
      .filter((t) => isWithinLastDays(t.weekEnding, 30))
      .map((t) => t.grossPay),
  );
  const staffSalariesLast30Days = sumMoney(
    operatingExpenseRows
      .filter((e) => isPayrollOperatingCategory(e.category))
      .filter((e) => isWithinLastDays(e.expenseDate, 30))
      .map((e) => e.amount),
  );
  const employeeBenefitsLast30Days = sumMoney(
    placementExpenseRows
      .filter((e) => e.expenseType === "benefits")
      .filter((e) => isWithinLastDays(e.expenseDate, 30))
      .map((e) => e.amount),
  );
  const payrollLast30Days = roundMoney(
    contractLaborLast30Days + staffSalariesLast30Days + employeeBenefitsLast30Days,
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

  const operatingExpenses = sumMoney(
    operatingExpenseRows.map((e) => e.amount),
  );
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
  const timesheetsAwaitingApproval = timesheets.filter(
    (t) => t.status === "submitted",
  ).length;

  const byMonth = new Map<string, number>();
  for (const inv of recognizedInvoices) {
    const key = yearMonth(inv.periodEnd);
    byMonth.set(key, roundMoney((byMonth.get(key) ?? 0) + inv.amount));
  }
  const revenueByMonth = [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({ month, amount }));

  const statusCounts: Record<string, number> = {};
  for (const inv of invoices) {
    if (!isRecognizedInvoice(inv.status)) continue;
    const key = inv.displayStatus;
    statusCounts[key] = (statusCounts[key] ?? 0) + 1;
  }

  const invoiceStatusOrder = [
    "Paid",
    "Sent",
    "Partially Paid",
    "Overdue",
    "Disputed",
  ] as const;

  const invoiceStatusChart = invoiceStatusOrder
    .map((name) => ({
      name,
      value: statusCounts[name] ?? 0,
    }))
    .filter((row) => row.value > 0);

  const activity = [
    ...recognizedInvoices.slice(0, 4).map((i) => ({
      id: `inv-${i.id}`,
      label: `Invoice ${i.displayStatus.toLowerCase()} · ${i.clientName}`,
      detail: money(i.amount),
      at: i.invoiceDate,
      href: `/accounting/invoices/${i.id}`,
    })),
    ...(payments.data ?? []).slice(0, 3).map((p) => ({
      id: `pay-${p.invoice_id}-${p.payment_date}`,
      label: isCompletedPayment(p.status as string)
        ? "Payment collected"
        : "Payment pending",
      detail: money(Number(p.amount)),
      at: (p.payment_date as string) ?? "",
      href: `/accounting/invoices/${p.invoice_id as string}`,
    })),
  ].slice(0, 8);

  return {
    cards: {
      earnedRevenue,
      billedRevenue,
      totalRevenue: billedRevenue,
      outstandingInvoices,
      payrollLast30Days,
      directLabor,
      activeContracts,
      timesheetsAwaitingApproval,
      totalExpenses: operatingExpenses,
      grossProfit,
      operatingIncome,
      collected,
      grossMarginPercent: computeGrossMarginPercent(billedRevenue, directLabor),
    },
    revenueByMonth,
    statusCounts,
    invoiceStatusChart,
    activity,
  };
}

export async function getProfitabilityData() {
  const [contracts, invoices, operatingExpenseRows, payroll] = await Promise.all([
    getContracts(),
    getInvoices(),
    getOperatingExpenses(),
    getPayrollRows(),
  ]);

  const recognizedInvoices = invoices.filter((i) =>
    isRecognizedInvoice(i.status),
  );
  const approvedPayroll = payroll.filter((r) =>
    isApprovedTimesheet(r.status),
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
  const operatingExpenses = sumMoney(operatingExpenseRows.map((e) => e.amount));
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
  for (const exp of operatingExpenseRows) {
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

export async function getAuditTrail(options?: {
  invoiceId?: string;
  placementId?: string;
  clientId?: string;
  limit?: number;
}) {
  const supabase = await createClient();
  const [invoices, paymentsRes, payroll, expenses, operatingExpenses, contracts, journalRes] =
    await Promise.all([
      getInvoices(),
      supabase
        .from("payments")
        .select("id, invoice_id, amount, status, payment_date, created_at"),
      getPayrollRows(),
      getExpenses(),
      getOperatingExpenses(),
      getContracts(),
      supabase
        .from("journal_entries")
        .select("id, entry_date, memo, reference, status, source_type, updated_at")
        .order("entry_date", { ascending: false })
        .limit(200),
    ]);

  const journalIds = (journalRes.data ?? []).map((j) => j.id as string);
  const { data: journalLineTotals } =
    journalIds.length === 0
      ? { data: [] as { journal_entry_id: string; debit: number }[] }
      : await supabase
          .from("journal_entry_lines")
          .select("journal_entry_id, debit")
          .in("journal_entry_id", journalIds);
  const jeDebits = new Map<string, number>();
  for (const row of journalLineTotals ?? []) {
    const id = String(row.journal_entry_id);
    jeDebits.set(id, roundMoney((jeDebits.get(id) ?? 0) + Number(row.debit ?? 0)));
  }

  const invoiceById = new Map(invoices.map((i) => [i.id, i]));
  const placementClient = new Map(
    contracts.map((c) => [c.id, c.clientId] as const),
  );

  let events = [
    ...invoices.map((i) =>
      buildInvoiceAuditEvent({
        id: i.id,
        clientId: i.clientId,
        clientName: i.clientName,
        amount: i.amount,
        status: i.status,
        periodEnd: i.periodEnd,
        createdAt: `${i.invoiceDate}T00:00:00.000Z`,
        placementId: i.placementId,
      }),
    ),
    ...(paymentsRes.data ?? []).map((p) => {
      const invoiceId = p.invoice_id as string;
      const inv = invoiceById.get(invoiceId);
      return {
        ...buildPaymentAuditEvent({
          id: p.id as string,
          invoiceId,
          amount: Number(p.amount),
          status: p.status as string,
          paymentDate: p.payment_date as string | null,
          createdAt: (p.created_at as string | null) ?? null,
        }),
        clientId: inv?.clientId ?? null,
        placementId: inv?.placementId ?? null,
      };
    }),
    ...payroll.map((r) => ({
      ...buildTimesheetAuditEvent({
        id: r.id,
        employeeName: r.employeeName,
        clientName: r.assignment,
        weekEnding: r.weekEnding,
        status: r.status,
        grossPay: r.grossPay,
        placementId: r.placementId,
      }),
      clientId: r.placementId
        ? (placementClient.get(r.placementId) ?? null)
        : null,
    })),
    ...expenses.map((e) =>
      buildExpenseAuditEvent({
        id: e.id,
        kind: "placement",
        label: e.expenseType,
        detail: `${e.clientName} · ${e.description}`,
        amount: e.amount,
        status: e.status,
        expenseDate: e.expenseDate,
        placementId: e.placementId,
        clientId: e.clientId,
      }),
    ),
    ...operatingExpenses.map((e) =>
      buildExpenseAuditEvent({
        id: e.id,
        kind: "operating",
        label: e.category,
        detail: e.description,
        amount: e.amount,
        status: "approved",
        expenseDate: e.expenseDate,
        placementId: null,
        clientId: null,
      }),
    ),
    ...contracts.map((c) =>
      buildContractAuditEvent({
        id: c.id,
        clientId: c.clientId,
        clientName: c.clientName,
        employeeName: c.employeeName,
        status: c.status,
        startDate: c.startDate,
      }),
    ),
    ...(journalRes.data ?? []).map((j) =>
      buildJournalAuditEvent({
        id: j.id as string,
        entryDate: j.entry_date as string,
        memo: (j.memo as string) || "",
        reference: (j.reference as string) || "",
        status: j.status as string,
        amount: jeDebits.get(j.id as string) ?? 0,
        sourceType: (j.source_type as string | null) ?? null,
        updatedAt: (j.updated_at as string | null) ?? null,
      }),
    ),
  ].map((e) => {
    if (e.invoiceId && invoiceById.has(e.invoiceId)) {
      const inv = invoiceById.get(e.invoiceId)!;
      return {
        ...e,
        clientId: e.clientId ?? inv.clientId,
        placementId: e.placementId ?? inv.placementId,
      };
    }
    return e;
  });

  if (options?.invoiceId) {
    events = events.filter((e) => e.invoiceId === options.invoiceId);
  }
  if (options?.placementId) {
    const relatedInvoiceIds = new Set(
      invoices
        .filter((i) => i.placementId === options.placementId)
        .map((i) => i.id),
    );
    events = events.filter(
      (e) =>
        e.placementId === options.placementId ||
        (e.invoiceId != null && relatedInvoiceIds.has(e.invoiceId)),
    );
  }
  if (options?.clientId) {
    events = events.filter((e) => e.clientId === options.clientId);
  }

  return mergeAuditEvents(events, options?.limit ?? 100);
}

export type JournalEntryListRow = {
  id: string;
  entryDate: string;
  memo: string;
  reference: string;
  status: JournalEntryStatus;
  sourceType: JournalEntrySourceType;
  sourceId: string | null;
  debitTotal: number;
  creditTotal: number;
  balanced: boolean;
  lineCount: number;
  updatedAt: string;
};

export type JournalEntryDetail = {
  id: string;
  entryDate: string;
  memo: string;
  reference: string;
  status: JournalEntryStatus;
  sourceType: JournalEntrySourceType;
  sourceId: string | null;
  postedAt: string | null;
  createdAt: string;
  updatedAt: string;
  debitTotal: number;
  creditTotal: number;
  balanced: boolean;
  lines: {
    id: string;
    lineNo: number;
    accountCode: string;
    accountName: string;
    description: string;
    debit: number;
    credit: number;
  }[];
};

export async function getJournalEntries(): Promise<JournalEntryListRow[]> {
  const supabase = await createClient();
  const { data: entries, error } = await supabase
    .from("journal_entries")
    .select(
      "id, entry_date, memo, reference, status, source_type, source_id, updated_at",
    )
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getJournalEntries", error.message);
    return [];
  }

  const ids = (entries ?? []).map((e) => e.id as string);
  const { data: lines } =
    ids.length === 0
      ? { data: [] as Record<string, unknown>[] }
      : await supabase
          .from("journal_entry_lines")
          .select("journal_entry_id, debit, credit")
          .in("journal_entry_id", ids);

  const totals = new Map<string, { debit: number; credit: number; count: number }>();
  for (const line of lines ?? []) {
    const id = String(line.journal_entry_id);
    const current = totals.get(id) ?? { debit: 0, credit: 0, count: 0 };
    current.debit = roundMoney(current.debit + Number(line.debit ?? 0));
    current.credit = roundMoney(current.credit + Number(line.credit ?? 0));
    current.count += 1;
    totals.set(id, current);
  }

  return (entries ?? []).map((e) => {
    const t = totals.get(e.id as string) ?? { debit: 0, credit: 0, count: 0 };
    return {
      id: e.id as string,
      entryDate: e.entry_date as string,
      memo: (e.memo as string) || "",
      reference: (e.reference as string) || "",
      status: e.status as JournalEntryStatus,
      sourceType: (e.source_type as JournalEntrySourceType) || "manual",
      sourceId: (e.source_id as string | null) ?? null,
      debitTotal: t.debit,
      creditTotal: t.credit,
      balanced: t.debit === t.credit && t.count > 0,
      lineCount: t.count,
      updatedAt: e.updated_at as string,
    };
  });
}

export async function getJournalEntryById(
  id: string,
): Promise<JournalEntryDetail | null> {
  const supabase = await createClient();
  const { data: entry, error } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !entry) {
    if (error) console.error("getJournalEntryById", error.message);
    return null;
  }

  const { data: lines, error: linesError } = await supabase
    .from("journal_entry_lines")
    .select("*")
    .eq("journal_entry_id", id)
    .order("line_no", { ascending: true });

  if (linesError) {
    console.error("getJournalEntryById lines", linesError.message);
  }

  const mappedLines = (lines ?? []).map((l) => ({
    id: l.id as string,
    lineNo: Number(l.line_no),
    accountCode: l.account_code as string,
    accountName: (l.account_name as string) || "",
    description: (l.description as string) || "",
    debit: Number(l.debit ?? 0),
    credit: Number(l.credit ?? 0),
  }));

  const debitTotal = sumMoney(mappedLines.map((l) => l.debit));
  const creditTotal = sumMoney(mappedLines.map((l) => l.credit));

  return {
    id: entry.id as string,
    entryDate: entry.entry_date as string,
    memo: (entry.memo as string) || "",
    reference: (entry.reference as string) || "",
    status: entry.status as JournalEntryStatus,
    sourceType: (entry.source_type as JournalEntrySourceType) || "manual",
    sourceId: (entry.source_id as string | null) ?? null,
    postedAt: (entry.posted_at as string | null) ?? null,
    createdAt: entry.created_at as string,
    updatedAt: entry.updated_at as string,
    debitTotal,
    creditTotal,
    balanced: debitTotal === creditTotal && mappedLines.length > 0,
    lines: mappedLines,
  };
}
