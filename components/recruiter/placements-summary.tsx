import { Clock3, Percent, UserCheck } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import type { PlacementMonthSummary } from "@/lib/recruiter/types";

export function PlacementsSummary({
  summary,
}: {
  summary: PlacementMonthSummary;
}) {
  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-3">
      <StatCard
        label="Total Placements"
        value={String(summary.totalPlacements)}
        description="This month"
        icon={<UserCheck className="h-4 w-4" />}
      />
      <StatCard
        label="Average Time to Fill"
        value={`${summary.averageTimeToFillDays} days`}
        description="Across closed searches"
        icon={<Clock3 className="h-4 w-4" />}
      />
      <StatCard
        label="Offer Acceptance Rate"
        value={`${Math.round(summary.offerAcceptanceRate * 100)}%`}
        description="Offers accepted vs sent"
        icon={<Percent className="h-4 w-4" />}
      />
    </div>
  );
}
