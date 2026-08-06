import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PinActionTaskButton } from "@/components/portal-pins/pin-action-task-button";
import { PinContractButton } from "@/components/portal-pins/pin-contract-button";
import {
  StaffingHealthStrip,
  type StaffingHealthItem,
} from "@/components/client-portal/staffing-health-strip";
import { loadClientPortalData } from "@/lib/client-portal/queries";
import {
  placementPositionTitle,
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

function marginPercent(
  bill: number | null,
  pay: number | null,
): number | null {
  if (bill == null || pay == null || bill <= 0) return null;
  return ((bill - pay) / bill) * 100;
}

export default async function ClientDashboardPage() {
  const data = await loadClientPortalData();
  const openPlacements = data.placements.filter(
    (p) => p.status === "active" || p.status === "at_risk",
  );
  const atRiskPlacements = data.placements.filter((p) => p.status === "at_risk");

  const openRoles = data.metrics.openPositions;
  const timesheetsDue = data.metrics.timesheetsAwaitingApproval;
  const outstandingInvoices = data.metrics.outstandingInvoices;
  const atRiskCount = atRiskPlacements.length;

  const healthItems: Array<
    StaffingHealthItem & {
      icon?: "roles" | "candidates" | "timesheets" | "invoices" | "atrisk";
    }
  > = [
    {
      id: "open-roles",
      label: "Open roles",
      value: openRoles,
      detail: "",
      href: "/client/job-requests?status=open",
      tone: openRoles === 0 ? "ok" : openRoles >= 3 ? "warn" : "info",
      icon: "roles",
    },
    {
      id: "timesheets",
      label: "Timesheets due",
      value: timesheetsDue,
      detail: "",
      href: "/client/timesheets?status=submitted",
      tone:
        timesheetsDue === 0 ? "ok" : timesheetsDue >= 3 ? "warn" : "info",
      icon: "timesheets",
    },
    {
      id: "invoices",
      label: "Outstanding invoices",
      value: outstandingInvoices,
      detail: "",
      href: "/client/invoices?status=outstanding",
      tone:
        outstandingInvoices === 0
          ? "ok"
          : outstandingInvoices >= 3
            ? "warn"
            : "info",
      icon: "invoices",
    },
    {
      id: "at-risk",
      label: "At-risk contracts",
      value: atRiskCount,
      detail: "",
      href: "/client/contracts?status=at_risk",
      tone: atRiskCount === 0 ? "ok" : "critical",
      icon: "atrisk",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" />

      <StaffingHealthStrip items={healthItems} />

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
                  <PinActionTaskButton
                    scope="client"
                    id={item.id}
                    title={item.title}
                    detail={item.detail}
                    href={item.href}
                    kind={
                      item.kind === "placement"
                        ? "contract"
                        : item.kind === "timesheet"
                          ? "timesheet"
                          : item.kind === "invoice"
                            ? "invoice"
                            : "task"
                    }
                  />
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

      <Card>
          <CardTitle className="mb-4">Recent activity</CardTitle>
          {data.recentActivity.length === 0 ? (
            <p className="text-sm text-[var(--cf-muted)]">
              No recent timesheet or invoice activity.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--cf-border)]">
              {data.recentActivity.slice(0, 6).map((item) => (
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
        <div className="mb-4 flex items-center justify-between gap-2">
          <CardTitle>Active placements</CardTitle>
          <Link
            href="/client/employees"
            className="text-sm font-medium text-[var(--cf-navy)] hover:underline"
          >
            View employees
          </Link>
        </div>
        <ul className="space-y-3">
          {openPlacements.map((p) => {
            const name = p.employee
              ? `${p.employee.first_name} ${p.employee.last_name}`
              : "Employee";
            const title = placementPositionTitle(p.title, p.placement_type);
            const m = marginPercent(p.bill_rate, p.pay_rate);
            return (
              <li
                key={p.id}
                className="flex flex-col gap-2 rounded-lg border border-[var(--cf-border)] p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--cf-ink)]">
                    {title} · {name}
                  </p>
                  <p className="text-xs text-[var(--cf-muted)]">
                    {shortPlacementNumber(p.id)} · Started{" "}
                    {p.start_date.slice(0, 10)}
                    {p.end_date
                      ? ` · Ends ${p.end_date.slice(0, 10)}`
                      : " · Open-ended"}
                    {p.status === "at_risk"
                      ? m != null
                        ? ` · ~${m.toFixed(0)}% margin (at risk)`
                        : " · at risk"
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={seedStatusTone(p.status)}>
                    {placementStatusLabel(p.status)}
                  </Badge>
                  <PinContractButton
                    scope="client"
                    contractId={p.id}
                    contractNumber={shortPlacementNumber(p.id)}
                    employeeName={name}
                    positionTitle={title}
                  />
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
