import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable, StatusPill } from "@/components/candidate/ui";
import {
  formatCurrency,
  formatDate,
  getCandidatePlacements,
} from "@/lib/candidate/data";

export default async function CandidateContractsPage() {
  const placements = await getCandidatePlacements();
  const reviewable = placements.filter((p) =>
    ["active", "at_risk", "completed"].includes(p.status),
  );

  return (
    <div>
      <PageHeader
        title="Contracts"
        description="Review your placement agreements, rates, and schedule windows."
      />
      {reviewable.length === 0 ? (
        <EmptyState
          title="No contracts to review"
          description="When a recruiter books you on a placement, the contract details will appear here."
        />
      ) : (
        <DataTable
          headers={[
            "Employer",
            "Type",
            "Pay rate",
            "Start",
            "End",
            "Guarantee",
            "Status",
          ]}
        >
          {reviewable.map((p) => (
            <tr key={p.id}>
              <td className="px-4 py-3 font-medium">
                {p.clients?.name ?? "Employer"}
                {p.clients?.industry ? (
                  <span className="mt-0.5 block text-xs font-normal text-[var(--cf-muted)]">
                    {p.clients.industry}
                  </span>
                ) : null}
              </td>
              <td className="px-4 py-3 capitalize">{p.placement_type}</td>
              <td className="px-4 py-3">{formatCurrency(p.pay_rate)}</td>
              <td className="px-4 py-3">{formatDate(p.start_date)}</td>
              <td className="px-4 py-3">{formatDate(p.end_date)}</td>
              <td className="px-4 py-3">{formatDate(p.guarantee_end_date)}</td>
              <td className="px-4 py-3">
                <StatusPill
                  label={p.status}
                  tone={
                    p.status === "active"
                      ? "good"
                      : p.status === "at_risk"
                        ? "warn"
                        : "neutral"
                  }
                />
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
