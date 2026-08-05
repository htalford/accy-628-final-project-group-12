import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import type { RecruiterPlacement } from "@/lib/recruiter/types";

export function PlacementsTable({ rows }: { rows: RecruiterPlacement[] }) {
  return (
    <DataTable
      rows={rows}
      emptyMessage="No placements for this month yet."
      columns={[
        { key: "candidate", header: "Candidate", render: (row) => row.candidate },
        { key: "client", header: "Client", render: (row) => row.client },
        { key: "job", header: "Job", render: (row) => row.job },
        {
          key: "type",
          header: "Placement Type",
          render: (row) => row.placementType,
        },
        { key: "start", header: "Start Date", render: (row) => row.startDate },
        {
          key: "status",
          header: "Status",
          render: (row) => <StatusBadge status={row.status} />,
        },
        { key: "recruiter", header: "Recruiter", render: (row) => row.recruiter },
      ]}
    />
  );
}
