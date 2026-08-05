import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export default function CandidateTimesheetsPage() {
  return (
    <div>
      <PageHeader
        title="Submit timesheet"
        description="Enter regular and overtime hours for the week ending date."
      />
      <EmptyState
        title="Timesheet form placeholder"
        description="A weekly hours form will live here, linked to your active placement."
      />
    </div>
  );
}
