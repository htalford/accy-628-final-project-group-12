import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge, statusTone } from "@/components/ui/status-badge";
import {
  ContractLink,
  EntityLink,
  TimesheetEmployeeLink,
  TimesheetLink,
} from "@/components/accounting/entity-links";
import { PayrollToolbar } from "@/components/accounting/payroll-toolbar";
import { getTimesheets } from "@/lib/accounting/queries";
import { moneyExact } from "@/lib/accounting/format";
import { payrollHref } from "@/lib/accounting/timesheet-links";

export default async function AccountingTimesheetsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; employee?: string; status?: string }>;
}) {
  const params = await searchParams;
  const rows = await getTimesheets();
  const employees = [...new Set(rows.map((r) => r.employeeName))].sort();
  const periods = [...new Set(rows.map((r) => r.weekEnding))].sort().reverse();

  const employeeParam = params.employee
    ? decodeURIComponent(params.employee)
    : undefined;

  const filtered = rows.filter((r) => {
    if (params.period && params.period !== "all" && r.weekEnding !== params.period)
      return false;
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
        title="Timesheets"
        actions={
          <Button href={payrollHref(sharedFilters)} variant="secondary">
            View payroll
          </Button>
        }
      />

      <PayrollToolbar employees={employees} periods={periods} />

      <DataTable
        rows={filtered}
        emptyTitle="No timesheets"
        emptyDescription="When candidates submit hours, they appear here and feed payroll."
        columns={[
          {
            key: "id",
            header: "Timesheet",
            render: (row) => <TimesheetLink id={row.id} />,
          },
          {
            key: "employee",
            header: "Candidate",
            render: (row) => (
              <TimesheetEmployeeLink name={row.employeeName} />
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
                href={payrollHref({
                  period: row.weekEnding,
                  employee: row.employeeName,
                })}
              >
                {row.weekEnding}
              </EntityLink>
            ),
          },
          {
            key: "regular",
            header: "Regular",
            render: (row) => row.hoursRegular,
          },
          {
            key: "ot",
            header: "Overtime",
            render: (row) => row.hoursOvertime,
          },
          {
            key: "total",
            header: "Total Hours",
            render: (row) => row.hoursWorked,
          },
          {
            key: "gross",
            header: "Gross Pay",
            render: (row) => (
              <EntityLink
                href={payrollHref({
                  period: row.weekEnding,
                  employee: row.employeeName,
                })}
              >
                {moneyExact(row.grossPay)}
              </EntityLink>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <StatusBadge label={row.status} tone={statusTone(row.status)} />
            ),
          },
        ]}
      />
    </div>
  );
}
