import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { listClients } from "@/lib/recruiter/data";

export default async function ClientsPage() {
  const rows = await listClients();

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Employers linked to job orders and placements."
      />
      <DataTable
        rows={rows}
        emptyMessage="No clients found."
        columns={[
          {
            key: "company",
            header: "Company",
            interactive: true,
            render: (row) => (
              <Link
                href={`/recruiter/clients/${row.id}`}
                className="font-medium text-[var(--cf-navy)] hover:underline"
              >
                {row.company}
              </Link>
            ),
          },
          {
            key: "contact",
            header: "Primary Contact",
            render: (row) => row.primaryContact,
          },
          { key: "phone", header: "Phone", render: (row) => row.phone },
          { key: "email", header: "Email", render: (row) => row.email },
          {
            key: "open",
            header: "Open Jobs",
            render: (row) => row.openJobs,
          },
          {
            key: "active",
            header: "Active Placements",
            render: (row) => row.activePlacements,
          },
          {
            key: "last",
            header: "Last Contact",
            render: (row) => row.lastContact,
          },
          {
            key: "status",
            header: "Status",
            render: (row) => <StatusBadge status={row.status} />,
          },
        ]}
      />
    </div>
  );
}
