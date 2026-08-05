import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";

export default function CandidateDashboardPage() {
  return (
    <div>
      <PageHeader
        title="My assignment"
        description="Your current placement details, rates, and schedule context."
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Current employer" value="—" />
        <StatCard label="Placement type" value="—" />
        <StatCard label="Status" value="—" />
      </div>
      <EmptyState
        title="Assignment details coming soon"
        description="We'll show your active placement, bill/pay context (as appropriate), and recent timesheet status."
      />
    </div>
  );
}
