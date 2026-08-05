import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable, StatusPill } from "@/components/candidate/ui";
import {
  formatCurrency,
  formatDate,
  getCandidatePlacements,
} from "@/lib/candidate/data";

export default async function CandidateCompletionsPage() {
  const placements = await getCandidatePlacements();
  const completed = placements.filter((p) =>
    ["completed", "cancelled"].includes(p.status),
  );

  return (
    <div>
      <PageHeader
        title="Contract completions"
        description="Finished and closed assignments, including end dates and final rates."
      />
      {completed.length === 0 ? (
        <EmptyState
          title="No completed contracts yet"
          description="When placements complete or cancel, their history will show up here."
        />
      ) : (
        <DataTable
          headers={[
            "Employer",
            "Type",
            "Pay rate",
            "Start",
            "End",
            "Outcome",
          ]}
        >
          {completed.map((p) => (
            <tr key={p.id}>
              <td className="px-4 py-3 font-medium">
                {p.clients?.name ?? "Employer"}
              </td>
              <td className="px-4 py-3 capitalize">{p.placement_type}</td>
              <td className="px-4 py-3">{formatCurrency(p.pay_rate)}</td>
              <td className="px-4 py-3">{formatDate(p.start_date)}</td>
              <td className="px-4 py-3">{formatDate(p.end_date)}</td>
              <td className="px-4 py-3">
                <StatusPill
                  label={p.status}
                  tone={p.status === "completed" ? "good" : "bad"}
                />
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
