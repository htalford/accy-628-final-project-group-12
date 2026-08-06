import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge, statusTone } from "@/components/ui/status-badge";
import {
  ClientArLink,
  ContractLink,
  PayrollEmployeeLink,
} from "@/components/accounting/entity-links";
import { getContracts } from "@/lib/accounting/queries";
import {
  moneyExact,
  placementStatusLabel,
  placementTypeLabel,
} from "@/lib/accounting/format";
import { ContractsToolbar } from "@/components/accounting/contracts-toolbar";

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const contracts = await getContracts();

  const filtered = contracts.filter((c) => {
    if (params.status && params.status !== "all" && c.status !== params.status)
      return false;
    if (params.q) {
      const q = params.q.toLowerCase();
      const hay = `${c.clientName} ${c.employeeName} ${c.id}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Contracts" />
      <ContractsToolbar />
      <DataTable
        rows={filtered}
        rowHref={(row) => `/accounting/contracts/${row.id}`}
        emptyTitle="No contracts"
        emptyDescription="Active placements will show here."
        columns={[
          {
            key: "number",
            header: "Contract Number",
            interactive: true,
            render: (row) => <ContractLink id={row.id} />,
          },
          {
            key: "candidate",
            header: "Candidate",
            interactive: true,
            render: (row) => (
              <PayrollEmployeeLink
                name={row.employeeName}
                employeeId={row.employeeId}
              />
            ),
          },
          {
            key: "client",
            header: "Client",
            interactive: true,
            render: (row) => (
              <ClientArLink clientId={row.clientId} name={row.clientName} />
            ),
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
            key: "billing",
            header: "Billing Type",
            render: (row) => placementTypeLabel(row.billingType),
          },
          {
            key: "rate",
            header: "Hourly Rate",
            render: (row) =>
              row.billRate != null ? moneyExact(row.billRate) : "—",
          },
          {
            key: "fee",
            header: "Placement Fee",
            render: (row) =>
              row.placementFee != null ? moneyExact(row.placementFee) : "—",
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
    </div>
  );
}
