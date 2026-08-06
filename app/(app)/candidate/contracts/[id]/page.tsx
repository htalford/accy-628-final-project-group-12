import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/candidate/ui";
import { StatusBadge, statusTone } from "@/components/ui/status-badge";
import { DataTable } from "@/components/ui/data-table";
import { getCandidateContractById } from "@/lib/candidate/data";
import {
  moneyExact,
  placementStatusLabel,
  placementTypeLabel,
  shortId,
} from "@/lib/accounting/format";

export default async function CandidateContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contract = await getCandidateContractById(id);
  if (!contract) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/candidate/contracts"
          className="text-sm text-[var(--cf-accent)] hover:underline"
        >
          ← Back to contracts
        </Link>
        <PageHeader
          title={`Contract ${shortId(contract.id)}`}
          description="Shared Placement / Contract record used by Accounting."
        />
        <div className="mt-2">
          <StatusBadge
            label={placementStatusLabel(contract.status)}
            tone={statusTone(contract.status)}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Contract information">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--cf-muted)]">Contract number</dt>
              <dd className="font-medium">{shortId(contract.id)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--cf-muted)]">Employer</dt>
              <dd className="font-medium text-right">
                {contract.client?.name ?? "—"}
                {contract.client?.industry ? (
                  <span className="mt-0.5 block text-xs font-normal text-[var(--cf-muted)]">
                    {contract.client.industry}
                  </span>
                ) : null}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--cf-muted)]">Type</dt>
              <dd>{placementTypeLabel(contract.billingType)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--cf-muted)]">Your pay rate</dt>
              <dd>
                {contract.payRate != null
                  ? `${moneyExact(contract.payRate)} / hr`
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
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--cf-muted)]">Guarantee end</dt>
              <dd>{contract.guaranteeEndDate ?? "—"}</dd>
            </div>
          </dl>
        </Panel>

        <Panel title="Linked timesheets">
          <DataTable
            rows={contract.timesheets}
            emptyTitle="No timesheets yet"
            emptyDescription="Hours you submit for this contract will show here."
            columns={[
              {
                key: "week",
                header: "Week ending",
                render: (row) => row.weekEndingDate,
              },
              {
                key: "reg",
                header: "Hours",
                render: (row) => String(row.hoursRegular),
              },
              {
                key: "ot",
                header: "Overtime",
                render: (row) => String(row.hoursOvertime),
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
          <Link
            href="/candidate/timesheets"
            className="mt-3 inline-block text-sm font-semibold text-[var(--cf-accent)] hover:underline"
          >
            Submit timesheet →
          </Link>
        </Panel>
      </div>
    </div>
  );
}
