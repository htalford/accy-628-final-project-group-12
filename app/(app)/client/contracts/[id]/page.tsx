import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/client-portal/breadcrumbs";
import { PinContractButton } from "@/components/portal-pins/pin-contract-button";
import { getPlacementForClient } from "@/lib/client-portal/queries";
import {
  formatMoney,
  placementPositionTitle,
  placementStatusLabel,
  placementTypeLabel,
  seedStatusTone,
  shortPlacementNumber,
} from "@/lib/client-portal/labels";

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = await getPlacementForClient(id);
  if (!p) notFound();

  const name = p.employee
    ? `${p.employee.first_name} ${p.employee.last_name}`
    : "Employee";
  const title = placementPositionTitle(p.title, p.placement_type);
  const number = shortPlacementNumber(p.id);

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Contracts", href: "/client/contracts" },
          { label: number },
        ]}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title={`Contract ${number}`}
          description={`${title} · ${name} · linked to Accounting portal contract #${number}`}
        />
        <div className="flex items-center gap-2">
          <Badge tone={seedStatusTone(p.status)}>
            {placementStatusLabel(p.status)}
          </Badge>
          <PinContractButton
            scope="client"
            contractId={p.id}
            contractNumber={number}
            employeeName={name}
            positionTitle={title}
            size="md"
          />
          <Button size="sm" variant="secondary" href="/client/contracts">
            Back
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardTitle className="mb-3">Contract Summary</CardTitle>
          <p className="text-sm text-[var(--cf-ink)]">
            Live placement record shared with accounting. Contract number and
            billing rates match the Accounting portal for this assignment.
          </p>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-[var(--cf-muted)]">Contract #</dt>
              <dd className="font-mono text-xs font-medium">{number}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--cf-muted)]">Position title</dt>
              <dd className="font-medium">{title}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--cf-muted)]">Employee</dt>
              <dd>{name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--cf-muted)]">Term</dt>
              <dd>
                {p.start_date.slice(0, 10)} →{" "}
                {p.end_date ? p.end_date.slice(0, 10) : "Open"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--cf-muted)]">Type</dt>
              <dd>{placementTypeLabel(p.placement_type)}</dd>
            </div>
          </dl>
        </Card>
        <Card>
          <CardTitle className="mb-3">Billing Information</CardTitle>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-[var(--cf-muted)]">Bill rate</dt>
              <dd>
                {p.bill_rate != null ? formatMoney(p.bill_rate) : "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--cf-muted)]">Pay rate</dt>
              <dd>
                {p.pay_rate != null ? formatMoney(p.pay_rate) : "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--cf-muted)]">Placement fee</dt>
              <dd>
                {p.placement_fee != null
                  ? formatMoney(p.placement_fee)
                  : "—"}
              </dd>
            </div>
            <p className="pt-2 text-xs text-[var(--cf-muted)]">
              OT client billing: 1.5 × bill_rate on overtime hours.
            </p>
          </dl>
        </Card>
      </div>
    </div>
  );
}
