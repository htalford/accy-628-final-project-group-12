import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/accounting/panel";
import { StatusBadge, statusTone } from "@/components/ui/status-badge";
import { AuditTrailList } from "@/components/accounting/audit-trail";
import {
  ClientArLink,
  InvoiceLink,
  PayrollEmployeeLink,
} from "@/components/accounting/entity-links";
import { PinContractButton } from "@/components/portal-pins/pin-contract-button";
import {
  getAuditTrail,
  getContractById,
} from "@/lib/accounting/queries";
import {
  expenseStatusLabel,
  expenseTypeLabel,
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
  const trail = await getAuditTrail({ placementId: id, limit: 40 });

  const employeeName = contract.employee
    ? `${contract.employee.first_name} ${contract.employee.last_name}`
    : null;
  const contractNumber = shortId(contract.id);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link
            href="/accounting/contracts"
            className="text-[var(--cf-accent)] hover:underline"
          >
            ← Back to contracts
          </Link>
          <Link
            href="/accounting/audit-trail"
            className="text-[var(--cf-muted)] hover:text-[var(--cf-accent)] hover:underline"
          >
            Full audit trail
          </Link>
        </div>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <PageHeader title={`Contract ${contractNumber}`} />
          <PinContractButton
            scope="accounting"
            contractId={contract.id}
            contractNumber={contractNumber}
            employeeName={employeeName ?? undefined}
            positionTitle={contract.client?.name}
            size="md"
          />
        </div>
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
              <dd>
                {contract.client ? (
                  <ClientArLink
                    clientId={contract.client.id}
                    name={contract.client.name}
                  />
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--cf-muted)]">Candidate</dt>
              <dd>
                {employeeName ? (
                  <PayrollEmployeeLink name={employeeName} />
                ) : (
                  "—"
                )}
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
                <span>
                  <InvoiceLink id={inv.id} />
                  <span className="ml-2 text-[var(--cf-muted)]">
                    {inv.periodStart} → {inv.periodEnd}
                  </span>
                </span>
                <span>
                  {moneyExact(inv.amount)} · {inv.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Related Timesheets">
          {contract.timesheets.length === 0 ? (
            <p className="text-sm text-[var(--cf-muted)]">No timesheets yet.</p>
          ) : (
            <ul className="divide-y divide-[var(--cf-border)] text-sm">
              {contract.timesheets.map((t) => (
                <li key={t.id} className="flex justify-between gap-3 py-2">
                  <Link
                    href={`/accounting/payroll?period=${t.weekEnding}${
                      employeeName
                        ? `&employee=${encodeURIComponent(employeeName)}`
                        : ""
                    }`}
                    className="font-medium text-[var(--cf-ink)] hover:underline"
                  >
                    Week ending {t.weekEnding} · {t.status}
                  </Link>
                  <span>
                    R {t.hoursRegular} / OT {t.hoursOvertime} ·{" "}
                    {moneyExact(t.grossPay)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Related Expenses">
          {contract.expenses.length === 0 ? (
            <p className="text-sm text-[var(--cf-muted)]">
              No expenses linked to this contract.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--cf-border)] text-sm">
              {contract.expenses.map((e) => (
                <li key={e.id} className="flex justify-between gap-3 py-2">
                  <Link
                    href="/accounting/expenses"
                    className="font-medium text-[var(--cf-ink)] hover:underline"
                  >
                    {e.expenseDate} · {expenseTypeLabel(e.expenseType)}
                    {e.description ? ` · ${e.description}` : ""}
                  </Link>
                  <span>
                    {moneyExact(e.amount)} · {expenseStatusLabel(e.status)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel
        title="Contract audit trail"
        description="Invoices, payments, timesheets, and expenses tied to this placement"
        action={
          <Link
            href="/accounting/audit-trail"
            className="text-sm font-medium text-[var(--cf-accent)] hover:underline"
          >
            View all →
          </Link>
        }
      >
        <AuditTrailList
          events={trail}
          emptyMessage="No related events for this contract yet."
        />
      </Panel>
    </div>
  );
}
