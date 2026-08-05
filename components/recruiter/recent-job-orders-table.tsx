import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import type { RecruiterJobOrder } from "@/lib/recruiter/types";

export function RecentJobOrdersTable({ rows }: { rows: RecruiterJobOrder[] }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--cf-ink)]">
          Recent Job Orders
        </h2>
        <Link
          href="/recruiter/job-orders"
          className="text-xs font-medium text-[var(--cf-accent)] hover:underline"
        >
          View all
        </Link>
      </div>
      <DataTable
        rows={rows}
        columns={[
          {
            key: "title",
            header: "Job Title",
            render: (row) => (
              <Link
                href={`/recruiter/job-orders/${row.id}`}
                className="font-medium text-[var(--cf-navy)] hover:underline"
              >
                {row.title}
              </Link>
            ),
          },
          { key: "client", header: "Client", render: (row) =>
            row.clientId ? (
              <Link
                href={`/recruiter/clients/${row.clientId}`}
                className="text-[var(--cf-navy)] hover:underline"
              >
                {row.client}
              </Link>
            ) : (
              row.client
            )
          },
          {
            key: "status",
            header: "Status",
            render: (row) => <StatusBadge status={row.status} />,
          },
          {
            key: "open",
            header: "Open Positions",
            render: (row) => row.openPositions,
          },
          {
            key: "priority",
            header: "Priority",
            render: (row) => <StatusBadge status={row.priority} />,
          },
        ]}
      />
    </section>
  );
}
