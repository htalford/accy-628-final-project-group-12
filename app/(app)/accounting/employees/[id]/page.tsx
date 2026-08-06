import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Panel } from "@/components/accounting/panel";
import { StatusBadge, statusTone } from "@/components/ui/status-badge";
import {
  ClientArLink,
  ContractLink,
  TimesheetLink,
} from "@/components/accounting/entity-links";
import { getAccountingEmployeeById } from "@/lib/accounting/queries";
import {
  moneyExact,
  placementStatusLabel,
  placementTypeLabel,
} from "@/lib/accounting/format";

export default async function AccountingEmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const employee = await getAccountingEmployeeById(id);
  if (!employee) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/accounting/payroll"
          className="text-sm font-medium text-[var(--cf-ink)] hover:underline"
        >
          ← Back to payroll
        </Link>
        <PageHeader
          title={employee.name}
          actions={
            <Button
              href={`/accounting/payroll?employee=${encodeURIComponent(employee.name)}`}
              variant="secondary"
            >
              View in payroll
            </Button>
          }
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge
          label={employee.status}
          tone={statusTone(employee.status)}
        />
        <StatusBadge
          label={employee.employmentType.replaceAll("_", " ")}
          tone="neutral"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Employee information">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--cf-muted)]">Name</dt>
              <dd className="font-medium">{employee.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--cf-muted)]">Email</dt>
              <dd>{employee.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--cf-muted)]">Phone</dt>
              <dd>{employee.phone ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--cf-muted)]">Employment type</dt>
              <dd className="capitalize">
                {employee.employmentType.replaceAll("_", " ")}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--cf-muted)]">Status</dt>
              <dd className="capitalize">{employee.status}</dd>
            </div>
            {employee.certifications ? (
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--cf-muted)]">Certifications</dt>
                <dd className="text-right">{employee.certifications}</dd>
              </div>
            ) : null}
            {employee.emergencyContactName ? (
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--cf-muted)]">Emergency contact</dt>
                <dd className="text-right">
                  {employee.emergencyContactName}
                  {employee.emergencyContactPhone
                    ? ` · ${employee.emergencyContactPhone}`
                    : ""}
                </dd>
              </div>
            ) : null}
            {employee.resumeUrl ? (
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--cf-muted)]">Resume</dt>
                <dd>
                  <a
                    href={employee.resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-[var(--cf-ink)] hover:underline"
                  >
                    Open resume
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>
        </Panel>

        <Panel title="Payroll summary">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--cf-muted)]">Timesheets</dt>
              <dd className="font-medium">{employee.timesheets.length}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--cf-muted)]">Total hours</dt>
              <dd className="font-medium">{employee.totals.hours}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--cf-muted)]">Gross pay</dt>
              <dd className="font-medium">
                {moneyExact(employee.totals.grossPay)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--cf-muted)]">Bill amount</dt>
              <dd>{moneyExact(employee.totals.billAmount)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--cf-muted)]">Contracts</dt>
              <dd>{employee.placements.length}</dd>
            </div>
          </dl>
        </Panel>
      </div>

      <Panel title="Contracts">
        <DataTable
          rows={employee.placements}
          emptyTitle="No contracts"
          emptyDescription="This employee has no placements yet."
          columns={[
            {
              key: "contract",
              header: "Contract",
              render: (row) => <ContractLink id={row.id} />,
            },
            {
              key: "client",
              header: "Client",
              render: (row) =>
                row.clientId ? (
                  <ClientArLink clientId={row.clientId} name={row.clientName} />
                ) : (
                  row.clientName
                ),
            },
            {
              key: "type",
              header: "Type",
              render: (row) => placementTypeLabel(row.billingType),
            },
            {
              key: "pay",
              header: "Pay rate",
              render: (row) =>
                row.payRate != null ? moneyExact(row.payRate) : "—",
            },
            {
              key: "bill",
              header: "Bill rate",
              render: (row) =>
                row.billRate != null ? moneyExact(row.billRate) : "—",
            },
            {
              key: "status",
              header: "Status",
              render: (row) => (
                <StatusBadge
                  label={placementStatusLabel(row.status)}
                  tone={statusTone(row.status)}
                />
              ),
            },
          ]}
        />
      </Panel>

      <Panel title="Timesheets">
        <DataTable
          rows={employee.timesheets}
          emptyTitle="No timesheets"
          emptyDescription="Submitted hours for this employee will appear here."
          columns={[
            {
              key: "timesheet",
              header: "Timesheet",
              render: (row) => <TimesheetLink id={row.id} />,
            },
            {
              key: "week",
              header: "Week ending",
              render: (row) => row.weekEnding,
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
              key: "regular",
              header: "Regular Hours",
              render: (row) => row.hoursRegular,
            },
            {
              key: "overtime",
              header: "Overtime Hours",
              render: (row) => row.hoursOvertime,
            },
            {
              key: "gross",
              header: "Gross pay",
              render: (row) => moneyExact(row.grossPay),
            },
            {
              key: "bill",
              header: "Bill amount",
              render: (row) => moneyExact(row.billAmount),
            },
            {
              key: "status",
              header: "Status",
              render: (row) => (
                <StatusBadge
                  label={row.status}
                  tone={statusTone(row.status)}
                />
              ),
            },
          ]}
        />
      </Panel>
    </div>
  );
}
