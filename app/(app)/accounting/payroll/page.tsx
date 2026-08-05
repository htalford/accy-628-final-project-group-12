import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge, statusTone } from "@/components/ui/status-badge";
import {
  ContractLink,
  EntityLink,
  PayrollEmployeeLink,
  TimesheetLink,
} from "@/components/accounting/entity-links";
import { getTimesheets } from "@/lib/accounting/queries";
import { moneyExact } from "@/lib/accounting/format";
import { PayrollToolbar } from "@/components/accounting/payroll-toolbar";
import { timesheetsHref } from "@/lib/accounting/timesheet-links";

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
  const rows = await getTimesheets();
  const employees = [...new Set(rows.map((r) => r.employeeName))].sort();
  const periods = [...new Set(rows.map((r) => r.weekEnding))].sort().reverse();

  const employeeParam = params.employee
    ? decodeURIComponent(params.employee)
    : undefined;
  const fromParam =
    params.from && /^\d{4}-\d{2}-\d{2}$/.test(params.from) ? params.from : undefined;

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

  const sharedFilters = {
    period: params.period,
    employee: employeeParam,
    status: params.status,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll"
        actions={
          <Button href={timesheetsHref(sharedFilters)} variant="secondary">
            View timesheets
          </Button>
        }
      />

      <PayrollToolbar employees={employees} periods={periods} />

      <DataTable
        rows={filtered}
        emptyTitle="No payroll rows"
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
              <PayrollEmployeeLink name={row.employeeName} />
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
    </div>
  );
}
