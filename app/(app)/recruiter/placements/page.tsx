import { PageHeader } from "@/components/ui/page-header";
import { PlacementsSummary } from "@/components/recruiter/placements-summary";
import { PlacementsTable } from "@/components/recruiter/placements-table";
import { RECRUITER_PAGE_COPY } from "@/components/recruiter/summary-cards";
import {
  getPlacementMonthSummary,
  listPlacementsThisMonth,
} from "@/lib/recruiter/data";

export default async function PlacementsPage() {
  const [summary, rows] = await Promise.all([
    getPlacementMonthSummary(),
    listPlacementsThisMonth(),
  ]);
  const copy = RECRUITER_PAGE_COPY.placements;

  return (
    <div>
      <PageHeader
        title="Placements This Month"
        description={copy.pageSubtitle}
      />
      <PlacementsSummary summary={summary} />
      <PlacementsTable rows={rows} />
    </div>
  );
}
