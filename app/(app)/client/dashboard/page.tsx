import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, THead, Th, Td } from "@/components/ui/table";
import {
  employeesFromPlacements,
  loadClientPortalData,
} from "@/lib/client-portal/queries";
import {
  formatMoney,
  placementStatusLabel,
  seedStatusTone,
  shortPlacementNumber,
  timesheetStatusLabel,
  invoiceStatusLabel,
} from "@/lib/client-portal/labels";

function actionStatusLabel(kind: string, status: string): string {
  if (kind === "timesheet") return timesheetStatusLabel(status);
  if (kind === "invoice") return invoiceStatusLabel(status);
  return placementStatusLabel(status);
}

export default async function ClientDashboardPage() {
  const data = await loadClientPortalData();
  const company = data.client?.name ?? "Your company";
  const openPlacements = data.placements.filter(
    (p) => p.status === "active" || p.status === "at_risk",
  );
  const employeeRows = employeesFromPlacements(data.placements).map((e) => {
    const hours = data.timesheets
      .filter((t) => t.placement_id === e.placementId)
      .slice(0, 1)
      .reduce((s, t) => s + t.hours_regular + t.hours_overtime, 0);
    return { ...e, hoursThisPeriod: hours };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`${company} · placements, timesheets, and invoices for your company.`}
      />

      {data.actionQueue.length > 0 ? (
        <Card className="border-amber-200 bg-amber-50/40">
          <div className="mb-3 flex items-center justify-between gap-2">
            <CardTitle>Needs attention</CardTitle>
            <span className="text-xs font-medium text-amber-900">
              {data.actionQueue.length} item
              {data.actionQueue.length === 1 ? "" : "s"}
            </span>
          </div>
          <ul className="divide-y divide-amber-100">
            {data.actionQueue.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--cf-ink)]">
                    {item.title}
                  </p>
                  <p className="text-sm text-[var(--cf-muted)]">{item.detail}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge tone={seedStatusTone(item.status)}>
                    {actionStatusLabel(item.kind, item.status)}
                  </Badge>
                  <Link href={item.href}>
                    <Button size="sm" variant="secondary">
                      Open
                    </Button>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Open Positions"
          value={String(data.metrics.openPositions)}
          hint="Open job requests"
          href="/client/job-requests?status=open"
        />
        <StatCard
          label="Current Employees"
          value={String(data.metrics.currentEmployees)}
          hint="Active & at-risk placements"
          href="/client/employees"
        />
        <StatCard
          label="Pending Candidate Reviews"
          value={String(data.metrics.pendingCandidateReviews)}
          hint="Candidates to review"
          href="/client/candidates"
        />
        <StatCard
          label="Active Contracts"
          value={String(data.metrics.activeContracts)}
          hint="Open placements"
          href="/client/contracts?status=active"
        />
        <StatCard
          label="Timesheets Awaiting Approval"
          value={String(data.metrics.timesheetsAwaitingApproval)}
          hint="Status: submitted"
          href="/client/timesheets?status=submitted"
        />
        <StatCard
          label="Outstanding Invoices"
          value={String(data.metrics.outstandingInvoices)}
          hint="Not paid"
          href="/client/invoices?status=outstanding"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardTitle className="mb-4">Recent Activity</CardTitle>
          {data.recentActivity.length === 0 ? (
            <p className="text-sm text-[var(--cf-muted)]">
              No recent timesheet or invoice activity.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--cf-border)]">
              {data.recentActivity.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-0.5 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--cf-ink)]">
                      {item.href ? (
                        <Link
                          href={item.href}
                          className="hover:text-[var(--cf-navy)] hover:underline"
                        >
                          {item.title}
                        </Link>
                      ) : (
                        item.title
                      )}
                    </p>
                    <p className="text-sm text-[var(--cf-muted)]">
                      {item.detail}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs text-[var(--cf-muted)]">
                    {item.timestamp}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardTitle className="mb-4">Quick Actions</CardTitle>
          <div className="flex flex-col gap-2">
            <Button href="/client/job-requests/new" className="w-full">
              Submit New Job Request
            </Button>
            <Button
              href="/client/candidates"
              variant="secondary"
              className="w-full"
            >
              Review Candidates
            </Button>
            <Button
              href="/client/timesheets?status=submitted"
              variant="secondary"
              className="w-full"
            >
              Approve Timesheets
            </Button>
            <Button
              href="/client/invoices?status=outstanding"
              variant="secondary"
              className="w-full"
            >
              View Invoices
            </Button>
          </div>
        </Card>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--cf-ink)]">
            Current Employees
          </h2>
          <Link
            href="/client/employees"
            className="text-sm font-medium text-[var(--cf-navy)] hover:underline"
          >
            View all
          </Link>
        </div>
        <Table>
          <THead>
            <tr>
              <Th>Employee Name</Th>
              <Th>Position</Th>
              <Th>Start Date</Th>
              <Th>Assignment Status</Th>
              <Th>Bill / Pay</Th>
              <Th>Latest Hours</Th>
              <Th> </Th>
            </tr>
          </THead>
          <tbody>
            {employeeRows.slice(0, 5).map((e) => (
              <tr key={e.placementId} className="hover:bg-[var(--cf-surface)]/60">
                <Td className="font-medium">{e.name}</Td>
                <Td>{e.title}</Td>
                <Td>{e.startDate.slice(0, 10)}</Td>
                <Td>
                  <Badge tone={seedStatusTone(e.status)}>
                    {placementStatusLabel(e.status)}
                  </Badge>
                </Td>
                <Td className="text-xs">
                  {e.billRate != null ? formatMoney(e.billRate) : "—"} /{" "}
                  {e.payRate != null ? formatMoney(e.payRate) : "—"}
                </Td>
                <Td>{e.hoursThisPeriod || "—"}</Td>
                <Td>
                  <Button
                    size="sm"
                    variant="secondary"
                    href={`/client/employees/${e.employeeId}`}
                  >
                    View Details
                  </Button>
                </Td>
              </tr>
            ))}
            {employeeRows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="border-t border-[var(--cf-border)] px-4 py-6 text-center text-sm text-[var(--cf-muted)]"
                >
                  No active placements for this client.
                </td>
              </tr>
            ) : null}
          </tbody>
        </Table>
      </div>

      <Card>
        <CardTitle className="mb-4">Active Placements</CardTitle>
        <ul className="space-y-3">
          {openPlacements.map((p) => {
            const name = p.employee
              ? `${p.employee.first_name} ${p.employee.last_name}`
              : "Employee";
            return (
              <li
                key={p.id}
                className="flex flex-col gap-2 rounded-lg border border-[var(--cf-border)] p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--cf-ink)]">
                    {p.title ?? "Assignment"} · {name}
                  </p>
                  <p className="text-xs text-[var(--cf-muted)]">
                    {shortPlacementNumber(p.id)} · Started{" "}
                    {p.start_date.slice(0, 10)}
                    {p.end_date
                      ? ` · Ends ${p.end_date.slice(0, 10)}`
                      : " · Open-ended"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={seedStatusTone(p.status)}>
                    {placementStatusLabel(p.status)}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    href={`/client/contracts/${p.id}`}
                  >
                    Open
                  </Button>
                </div>
              </li>
            );
          })}
          {openPlacements.length === 0 ? (
            <p className="text-sm text-[var(--cf-muted)]">
              No active placements.
            </p>
          ) : null}
        </ul>
      </Card>
    </div>
  );
}
