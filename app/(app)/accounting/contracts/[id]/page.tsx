import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/accounting/panel";
import { StatusBadge, statusTone } from "@/components/ui/status-badge";
import { getContractById } from "@/lib/accounting/queries";
import {
  moneyExact,
  placementStatusLabel,
  placementTypeLabel,
  shortId,
} from "@/lib/accounting/format";
import {
  computeTempMarginPercent,
  isAtRiskMargin,
} from "@/lib/accounting/calculations";

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contract = await getContractById(id);
  if (!contract) notFound();

  const marginPercent = computeTempMarginPercent(
    contract.billRate,
    contract.payRate,
  );
  const isAtRisk = isAtRiskMargin(marginPercent);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/accounting/contracts"
          className="text-sm text-[var(--cf-accent)] hover:underline"
        >
          ← Back to contracts
        </Link>
        <PageHeader
          title={`Contract ${shortId(contract.id)}`}
          description={`${contract.client?.name ?? "Client"} · ${contract.employee ? `${contract.employee.first_name} ${contract.employee.last_name}` : "Candidate"}`}
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusBadge
            label={placementStatusLabel(contract.status)}
            tone={statusTone(contract.status)}
          />
          {isAtRisk ? <StatusBadge label="Critical" tone="danger" /> : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Contract Information">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--cf-muted)]">Client</dt>
              <dd>{contract.client?.name ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--cf-muted)]">Candidate</dt>
              <dd>
                {contract.employee
                  ? `${contract.employee.first_name} ${contract.employee.last_name}`
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--cf-muted)]">Start</dt>
              <dd>{contract.startDate}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--cf-muted)]">End</dt>
              <dd>{contract.endDate ?? "Open"}</dd>
            </div>
          </dl>
        </Panel>
        <Panel title="Billing Terms">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--cf-muted)]">Billing type</dt>
              <dd>{placementTypeLabel(contract.billingType)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--cf-muted)]">Bill rate</dt>
              <dd>
                {contract.billRate != null
                  ? moneyExact(contract.billRate)
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--cf-muted)]">Pay rate</dt>
              <dd>
                {contract.payRate != null ? moneyExact(contract.payRate) : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--cf-muted)]">Margin %</dt>
              <dd>
                {marginPercent != null ? `${marginPercent.toFixed(1)}%` : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--cf-muted)]">At Risk</dt>
              <dd>
                {isAtRisk ? (
                  <StatusBadge label="Critical" tone="danger" />
                ) : (
                  "No"
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--cf-muted)]">Placement fee</dt>
              <dd>
                {contract.placementFee != null
                  ? moneyExact(contract.placementFee)
                  : "—"}
              </dd>
            </div>
          </dl>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Renewal Date">
          <p className="text-sm text-[var(--cf-ink)]">
            {contract.guaranteeEndDate ??
              contract.endDate ??
              "No renewal / guarantee date on file."}
          </p>
        </Panel>
        <Panel title="Assigned Recruiter">
          <p className="text-sm text-[var(--cf-ink)]">
            {contract.recruiter
              ? `${contract.recruiter.name} · ${contract.recruiter.email}`
              : "No recruiter profile found."}
          </p>
        </Panel>
      </div>

      <Panel title="Related Invoices">
        {contract.invoices.length === 0 ? (
          <p className="text-sm text-[var(--cf-muted)]">
            No invoices linked to this placement yet.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--cf-border)] text-sm">
            {contract.invoices.map((inv) => (
              <li key={inv.id} className="flex justify-between gap-3 py-2">
                <Link
                  href={`/accounting/invoices/${inv.id}`}
                  className="text-[var(--cf-accent)] hover:underline"
                >
                  {shortId(inv.id)} · {inv.periodStart} → {inv.periodEnd}
                </Link>
                <span>
                  {moneyExact(inv.amount)} · {inv.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
