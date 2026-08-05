import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/accounting/panel";
import { StatusBadge, statusTone } from "@/components/ui/status-badge";
import {
  ClientArLink,
  ContractLink,
  TimesheetEmployeeLink,
} from "@/components/accounting/entity-links";
import { getTimesheetById } from "@/lib/accounting/queries";
import { moneyExact, shortId } from "@/lib/accounting/format";

export default async function AccountingTimesheetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sheet = await getTimesheetById(id);
  if (!sheet) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/accounting/timesheets"
          className="text-sm font-medium text-[var(--cf-ink)] hover:underline"
        >
          ← Back to timesheets
        </Link>
        <PageHeader title={`Timesheet ${shortId(sheet.id)}`} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge label={sheet.status} tone={statusTone(sheet.status)} />
        <span className="text-sm text-[var(--cf-muted)]">
          Week ending {sheet.weekEnding}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Candidate">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--cf-muted)]">Name</dt>
              <dd>
                <TimesheetEmployeeLink name={sheet.employeeName} />
              </dd>
            </div>
            {sheet.employeeEmail ? (
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--cf-muted)]">Email</dt>
                <dd>{sheet.employeeEmail}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--cf-muted)]">Assignment</dt>
              <dd>
                {sheet.clientId ? (
                  <ClientArLink
                    clientId={sheet.clientId}
                    name={sheet.assignment}
                  />
                ) : (
                  sheet.assignment
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--cf-muted)]">Contract</dt>
              <dd>
                {sheet.placementId ? (
                  <ContractLink id={sheet.placementId} />
                ) : (
                  <span className="text-[var(--cf-muted)]">—</span>
                )}
              </dd>
            </div>
          </dl>
        </Panel>

        <Panel title="Hours & pay">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--cf-muted)]">Regular hours</dt>
              <dd>{sheet.hoursRegular}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--cf-muted)]">Overtime hours</dt>
              <dd>{sheet.hoursOvertime}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--cf-muted)]">Total hours</dt>
              <dd className="font-medium">{sheet.hoursWorked}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--cf-muted)]">Pay rate</dt>
              <dd>{moneyExact(sheet.payRate)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--cf-muted)]">Gross pay</dt>
              <dd className="font-medium">{moneyExact(sheet.grossPay)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--cf-muted)]">Bill amount</dt>
              <dd>{moneyExact(sheet.billAmount)}</dd>
            </div>
          </dl>
        </Panel>
      </div>

      {sheet.employerNote ? (
        <Panel title="Employer note">
          <p className="text-sm text-[var(--cf-ink)]">{sheet.employerNote}</p>
        </Panel>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button
          href={`/accounting/payroll?employee=${encodeURIComponent(sheet.employeeName)}&period=${sheet.weekEnding}`}
          variant="secondary"
        >
          View in payroll
        </Button>
        <Button href="/accounting/timesheets" variant="ghost">
          All timesheets
        </Button>
        {sheet.placementId ? (
          <Button
            href={`/accounting/contracts/${sheet.placementId}`}
            variant="ghost"
          >
            Open contract
          </Button>
        ) : null}
      </div>
    </div>
  );
}
