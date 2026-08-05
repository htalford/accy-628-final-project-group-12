import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge, statusTone } from "@/components/ui/status-badge";
import {
  ContractLink,
  EntityLink,
  PayrollEmployeeLink,
} from "@/components/accounting/entity-links";
import { getPayrollRows } from "@/lib/accounting/queries";
import { moneyExact } from "@/lib/accounting/format";
import { PayrollToolbar } from "@/components/accounting/payroll-toolbar";

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; employee?: string; status?: string }>;
}) {
  const params = await searchParams;
  const rows = await getPayrollRows();
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader title="Payroll" />
        <div className="flex gap-2">
          <Button variant="secondary" disabled>
            View Payroll
          </Button>
          <Button disabled>Process Payroll</Button>
        </div>
      </div>

      <PayrollToolbar employees={employees} periods={periods} />

      <DataTable
        rows={filtered}
        emptyTitle="No payroll rows"
        emptyDescription="Approved timesheets will appear here automatically."
        columns={[
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
            key: "hours",
            header: "Hours Worked",
            render: (row) =>
              `${row.hoursWorked} (R ${row.hoursRegular} / OT ${row.hoursOvertime})`,
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
