import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  employeesFromPlacements,
  loadClientPortalData,
} from "@/lib/client-portal/queries";
import {
  formatMoney,
  placementStatusLabel,
  seedStatusTone,
} from "@/lib/client-portal/labels";

export default async function EmployeesPage() {
  const data = await loadClientPortalData();
  const rows = employeesFromPlacements(data.placements).map((e) => {
    const latest = data.timesheets.find((t) => t.placement_id === e.placementId);
    return {
      ...e,
      hoursThisPeriod: latest
        ? latest.hours_regular + latest.hours_overtime
        : 0,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description={`Assignments at ${data.client?.name ?? "your company"} from live placement seed data.`}
      />
      {rows.length === 0 ? (
        <EmptyState
          title="No active employees"
          description="When TalentQuest places people on assignments for your company, they will appear here."
          action={
            <Button href="/client/job-requests/new" variant="secondary">
              Submit a job request
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((e) => (
            <Card key={e.placementId} className="flex flex-col">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <p className="text-base font-semibold text-[var(--cf-ink)]">
                    {e.name}
                  </p>
                  <p className="text-sm text-[var(--cf-muted)]">{e.title}</p>
                  <p className="mt-0.5 text-xs text-[var(--cf-muted)]">
                    bill {e.billRate != null ? formatMoney(e.billRate) : "—"} ·
                    pay {e.payRate != null ? formatMoney(e.payRate) : "—"}
                  </p>
                </div>
                <Badge tone={seedStatusTone(e.status)}>
                  {placementStatusLabel(e.status)}
                </Badge>
              </div>
              <dl className="mb-4 space-y-1.5 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--cf-muted)]">Start date</dt>
                  <dd>{e.startDate.slice(0, 10)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--cf-muted)]">Type</dt>
                  <dd className="capitalize">{e.placementType}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--cf-muted)]">Latest week hours</dt>
                  <dd className="font-medium">{e.hoursThisPeriod || "—"}</dd>
                </div>
              </dl>
              <Button
                variant="secondary"
                size="sm"
                className="mt-auto w-full"
                href={`/client/employees/${e.employeeId}`}
              >
                View details
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
