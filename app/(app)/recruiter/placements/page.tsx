import { PageHeader } from "@/components/ui/page-header";
import { PlacementsSummary } from "@/components/recruiter/placements-summary";
import { PlacementsTable } from "@/components/recruiter/placements-table";
import {
  getPlacementMonthSummary,
  listPlacementsThisMonth,
} from "@/lib/recruiter/data";

export default async function PlacementsPage() {
  const [summary, rows] = await Promise.all([
    getPlacementMonthSummary(),
    listPlacementsThisMonth(),
  ]);

  return (
    <div>
      <PageHeader title="Placements This Month" />
      <PlacementsSummary summary={summary} />
      <PlacementsTable rows={rows} />
    </div>
  );
}
