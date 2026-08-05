import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export default function ManagerPlacementsPage() {
  return (
    <div>
      <PageHeader
        title="Placements"
        description="Manage temp and permanent placements across client companies."
      />
      <EmptyState
        title="Placement list placeholder"
        description="Table of placements with type, rates/fees, dates, and status will go here."
      />
    </div>
  );
}
