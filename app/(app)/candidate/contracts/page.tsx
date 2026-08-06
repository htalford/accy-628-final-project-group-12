import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge, statusTone } from "@/components/ui/status-badge";
import { getCandidateContracts } from "@/lib/candidate/data";
import {
  moneyExact,
  placementStatusLabel,
  placementTypeLabel,
  shortId,
} from "@/lib/accounting/format";

export default async function CandidateContractsPage() {
  const contracts = await getCandidateContracts();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contracts"
        description="Your placement agreements from the TalentQuest Manager Portal — same contract records your agency tracks."
      />
      <DataTable
        rows={contracts}
        rowHref={(row) => `/candidate/contracts/${row.id}`}
        emptyTitle="No contracts yet"
        emptyDescription="When the Manager Portal books a placement for you, it will appear here with the same contract number."
        columns={[
          {
            key: "number",
            header: "Contract Number",
            render: (row) => (
              <span className="font-medium text-[var(--cf-accent)]">
                {shortId(row.id)}
              </span>
            ),
          },
          {
            key: "employer",
            header: "Employer",
            render: (row) => row.clientName,
          },
          {
            key: "start",
            header: "Start Date",
            render: (row) => row.startDate,
          },
          {
            key: "end",
            header: "End Date",
            render: (row) => row.endDate ?? "—",
          },
          {
            key: "type",
            header: "Type",
            render: (row) => placementTypeLabel(row.billingType),
          },
          {
            key: "rate",
            header: "Your Pay Rate",
            render: (row) =>
              row.payRate != null ? moneyExact(row.payRate) : "—",
          },
          {
            key: "guarantee",
            header: "Guarantee End",
            render: (row) => row.guaranteeEndDate ?? "—",
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
      {contracts.length > 0 ? (
        <p className="text-xs text-[var(--cf-muted)]">
          Contract numbers match Manager Portal → Contracts.{" "}
          <Link
            href="/candidate/timesheets"
            className="font-medium text-[var(--cf-accent)] hover:underline"
          >
            Submit timesheets
          </Link>{" "}
          against your active contract.
        </p>
      ) : null}
    </div>
  );
}
