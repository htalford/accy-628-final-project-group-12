import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export default function ClientTimesheetsPage() {
  return (
    <div>
      <PageHeader
        title="Timesheet approval"
        description="Review submitted hours for workers placed at your company."
      />
      <EmptyState
        title="Approval queue placeholder"
        description="Submitted timesheets will appear here for approve / dispute / reject actions."
      />
    </div>
  );
}
