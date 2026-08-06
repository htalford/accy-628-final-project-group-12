import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, THead, Th, Td } from "@/components/ui/table";
import { Breadcrumbs } from "@/components/client-portal/breadcrumbs";
import { loadClientPortalData } from "@/lib/client-portal/queries";
import {
  formatMoney,
  placementStatusLabel,
  placementTypeLabel,
  seedStatusTone,
  timesheetStatusLabel,
} from "@/lib/client-portal/labels";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await loadClientPortalData();
  const placement = data.placements.find((p) => p.employee_id === id);
  if (!placement?.employee) notFound();

  const emp = placement.employee;
  const name = `${emp.first_name} ${emp.last_name}`;
  const title =
    placement.title ??
    (placement.placement_type === "permanent"
      ? "Permanent Placement"
      : "Temporary Assignment");
  const history = data.timesheets.filter((t) => t.placement_id === placement.id);

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Employees", href: "/client/employees" },
          { label: name },
        ]}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader title={name} description={title} />
        <div className="flex items-center gap-2">
          <Badge tone={seedStatusTone(placement.status)}>
            {placementStatusLabel(placement.status)}
          </Badge>
          <Button size="sm" variant="secondary" href="/client/employees">
            Back
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardTitle className="mb-3">Contact Information</CardTitle>
          <p className="text-sm">{emp.email}</p>
          <p className="text-sm text-[var(--cf-muted)]">{emp.phone ?? "—"}</p>
        </Card>
        <Card>
          <CardTitle className="mb-3">Assignment Details</CardTitle>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-[var(--cf-muted)]">Position title</dt>
              <dd className="font-medium">{title}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--cf-muted)]">Type</dt>
              <dd className="font-medium">
                {placementTypeLabel(placement.placement_type)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--cf-muted)]">Start date</dt>
              <dd className="font-medium">{placement.start_date.slice(0, 10)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--cf-muted)]">Bill / Pay rate</dt>
              <dd className="font-medium">
                {placement.bill_rate != null
                  ? formatMoney(placement.bill_rate)
                  : "—"}{" "}
                /{" "}
                {placement.pay_rate != null
                  ? formatMoney(placement.pay_rate)
                  : "—"}
              </dd>
            </div>
          </dl>
        </Card>
        <div className="md:col-span-2">
          <CardTitle className="mb-3">Timesheet History</CardTitle>
          <Table>
            <THead>
              <tr>
                <Th>Week Ending</Th>
                <Th>Regular</Th>
                <Th>OT</Th>
                <Th>Total</Th>
                <Th>Status</Th>
                <Th> </Th>
              </tr>
            </THead>
            <tbody>
              {history.map((t) => (
                <tr key={t.id}>
                  <Td>{t.week_ending_date.slice(0, 10)}</Td>
                  <Td>{t.hours_regular}</Td>
                  <Td>{t.hours_overtime}</Td>
                  <Td>{t.hours_regular + t.hours_overtime}</Td>
                  <Td>
                    <Badge tone={seedStatusTone(t.status)}>
                      {timesheetStatusLabel(t.status)}
                    </Badge>
                  </Td>
                  <Td>
                    <Link
                      href={`/client/timesheets/${t.id}`}
                      className="text-sm font-medium text-[var(--cf-navy)] hover:underline"
                    >
                      View
                    </Link>
                  </Td>
                </tr>
              ))}
              {history.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="border-t border-[var(--cf-border)] px-4 py-4 text-sm text-[var(--cf-muted)]"
                  >
                    No timesheets for this placement yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </Table>
        </div>
      </div>
    </div>
  );
}
