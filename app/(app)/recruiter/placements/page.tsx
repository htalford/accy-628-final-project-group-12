import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export default function RecruiterPlacementsPage() {
  return (
    <div>
      <PageHeader
        title="Placements"
        description="Manage temp and permanent placements across employer companies."
      />
      <EmptyState
        title="Placement list placeholder"
        description="Table of placements with type, rates/fees, dates, and status will go here."
      />
    </div>
  );
}
