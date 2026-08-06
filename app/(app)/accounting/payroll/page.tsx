import Link from "next/link";
import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge, statusTone } from "@/components/ui/status-badge";
import { CollapsiblePanel } from "@/components/accounting/collapsible-panel";
import {
  ContractLink,
  EntityLink,
  PayrollEmployeeLink,
  TimesheetLink,
} from "@/components/accounting/entity-links";
import {
  getOperatingExpenses,
  getTimesheets,
} from "@/lib/accounting/queries";
import {
  money,
  moneyExact,
  operatingExpenseCategoryLabel,
} from "@/lib/accounting/format";
import { PayrollToolbar } from "@/components/accounting/payroll-toolbar";
import { timesheetsHref } from "@/lib/accounting/timesheet-links";
import { yearMonth } from "@/lib/accounting/calculations";
import { isPayrollOperatingCategory } from "@/lib/accounting/payroll-expenses";

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{
    period?: string;
    employee?: string;
    status?: string;
    from?: string;
  }>;
}) {
  const params = await searchParams;
  const [rows, operatingExpenses] = await Promise.all([
    getTimesheets(),
    getOperatingExpenses(),
  ]);
  const employees = [...new Set(rows.map((r) => r.employeeName))].sort();
  const periods = [...new Set(rows.map((r) => r.weekEnding))].sort().reverse();

  const disputedCount = rows.filter((r) => r.status === "disputed").length;

  const employeeParam = params.employee
    ? decodeURIComponent(params.employee)
    : undefined;
  const fromParam =
    params.from && /^\d{4}-\d{2}-\d{2}$/.test(params.from)
      ? params.from
      : undefined;

  const filtered = rows.filter((r) => {
    if (params.period && params.period !== "all" && r.weekEnding !== params.period)
      return false;
    if (fromParam && r.weekEnding < fromParam) return false;
    if (
      employeeParam &&
      employeeParam !== "all" &&
      r.employeeName !== employeeParam &&
      !r.employeeName.toLowerCase().includes(employeeParam.toLowerCase()) &&
      !r.id.includes(employeeParam)
    )
      return false;
    if (params.status && params.status !== "all" && r.status !== params.status)
      return false;
    return true;
  });

  function matchesExpenseDateFilters(expenseDate: string, month: string) {
    if (fromParam && expenseDate < fromParam) return false;
    if (
      params.period &&
      params.period !== "all" &&
      month !== yearMonth(params.period) &&
      yearMonth(expenseDate) !== yearMonth(params.period)
    ) {
      return false;
    }
    return true;
  }

  const staffPayrollExpenses = operatingExpenses
    .filter((e) => isPayrollOperatingCategory(e.category))
    .filter((e) => matchesExpenseDateFilters(e.expenseDate, e.month))
    .filter((e) => {
      if (!employeeParam || employeeParam === "all") return true;
      const label = operatingExpenseCategoryLabel(e.category).toLowerCase();
      const q = employeeParam.toLowerCase();
      return label.includes(q) || e.description.toLowerCase().includes(q);
    });

  const contractLaborTotal = filtered.reduce((s, r) => s + r.grossPay, 0);
  const staffPayrollTotal = staffPayrollExpenses.reduce((s, e) => s + e.amount, 0);

  const sharedFilters = {
    period: params.period,
    employee: employeeParam,
    status: params.status,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--cf-ink)]">
            Payroll
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link
              href="/accounting/payroll?status=disputed"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:underline"
            >
              <CircleAlert className="h-4 w-4 shrink-0" aria-hidden />
              <span>
                {disputedCount === 1
                  ? "1 disputed payroll"
                  : `${disputedCount} disputed payroll`}
              </span>
            </Link>
            <Link
              href="/accounting/timesheets?status=disputed"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:underline"
            >
              <CircleAlert className="h-4 w-4 shrink-0" aria-hidden />
              <span>
                {disputedCount === 1
                  ? "1 disputed timesheet"
                  : `${disputedCount} disputed timesheets`}
              </span>
            </Link>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button href="/accounting/expenses" variant="secondary">
            Open Expenses
          </Button>
          <Button href={timesheetsHref(sharedFilters)} variant="secondary">
            View timesheets
          </Button>
        </div>
      </div>

      <PayrollToolbar employees={employees} periods={periods} />

      <CollapsiblePanel
        id="contract-labor"
        title="Contract Labor"
        defaultOpen={filtered.length > 0 || staffPayrollExpenses.length === 0}
        action={
          <span className="text-sm font-semibold text-[var(--cf-ink)]">
            {money(contractLaborTotal)}
          </span>
        }
      >
        <DataTable
          rows={filtered}
          emptyTitle="No contract labor rows"
          emptyDescription="Candidate timesheets feed this payroll view automatically."
          columns={[
            {
              key: "timesheet",
              header: "Timesheet",
              render: (row) => <TimesheetLink id={row.id} />,
            },
            {
              key: "employee",
              header: "Employee Name",
              render: (row) => (
                <PayrollEmployeeLink
                  name={row.employeeName}
                  employeeId={row.employeeId}
                />
              ),
            },
            {
              key: "assignment",
              header: "Assignment",
              render: (row) =>
                row.placementId ? (
                  <ContractLink id={row.placementId} label={row.assignment} />
                ) : (
                  row.assignment
                ),
            },
            {
              key: "contract",
              header: "Contract",
              render: (row) =>
                row.placementId ? (
                  <ContractLink id={row.placementId} />
                ) : (
                  <span className="text-[var(--cf-muted)]">—</span>
                ),
            },
            {
              key: "week",
              header: "Week Ending",
              render: (row) => (
                <EntityLink
                  href={timesheetsHref({
                    period: row.weekEnding,
                    employee: row.employeeName,
                  })}
                >
                  {row.weekEnding}
                </EntityLink>
              ),
            },
            {
              key: "hours",
              header: "Hours Worked",
              render: (row) => (
                <EntityLink href={`/accounting/timesheets/${row.id}`}>
                  {`${row.hoursWorked} (R ${row.hoursRegular} / OT ${row.hoursOvertime})`}
                </EntityLink>
              ),
            },
            {
              key: "rate",
              header: "Pay Rate",
              render: (row) => moneyExact(row.payRate),
            },
            {
              key: "gross",
              header: "Gross Pay",
              render: (row) => moneyExact(row.grossPay),
            },
            {
              key: "earned",
              header: "Bill Amount",
              render: (row) => (
                <EntityLink href="/accounting/invoices">
                  {moneyExact(row.billAmount)}
                </EntityLink>
              ),
            },
            {
              key: "status",
              header: "Payroll Status",
              render: (row) => (
                <StatusBadge label={row.status} tone={statusTone(row.status)} />
              ),
            },
          ]}
        />
      </CollapsiblePanel>

      <CollapsiblePanel
        id="staff-payroll-expenses"
        title="Staff Payroll"
        defaultOpen={staffPayrollExpenses.length > 0}
        action={
          <span className="flex items-center gap-3 text-sm">
            <Link
              href="/accounting/expenses#payroll"
              className="font-medium text-[var(--cf-ink)] hover:underline"
            >
              View on Expenses →
            </Link>
            <span className="font-semibold text-[var(--cf-ink)]">
              {money(staffPayrollTotal)}
            </span>
          </span>
        }
      >
        <DataTable
          rows={staffPayrollExpenses}
          emptyTitle="No staff payroll expenses"
          emptyDescription="Add recruiter/accounting salaries (or payroll / employee wages) on Expenses to see them here."
          columns={[
            {
              key: "date",
              header: "Expense Date",
              render: (row) => row.expenseDate,
            },
            {
              key: "month",
              header: "Month",
              render: (row) => row.month,
            },
            {
              key: "category",
              header: "Category",
              render: (row) => operatingExpenseCategoryLabel(row.category),
            },
            {
              key: "description",
              header: "Description",
              render: (row) => (
                <EntityLink href={`/accounting/expenses?focus=${row.id}#payroll`}>
                  {row.description}
                </EntityLink>
              ),
            },
            {
              key: "source",
              header: "Source",
              render: () => (
                <EntityLink href="/accounting/expenses#payroll">
                  Expenses
                </EntityLink>
              ),
            },
            {
              key: "amount",
              header: "Amount",
              render: (row) => moneyExact(row.amount),
            },
          ]}
        />
      </CollapsiblePanel>
    </div>
  );
}
