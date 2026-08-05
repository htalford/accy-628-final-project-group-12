import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";

export default function ManagerDashboardPage() {
  return (
    <div>
      <PageHeader
        title="Operations dashboard"
        description="All placements at a glance, with attention on at-risk assignments."
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Active placements" value="—" />
        <StatCard label="At-risk" value="—" hint="Needs follow-up" />
        <StatCard label="Pending timesheets" value="—" />
      </div>
      <EmptyState
        title="Portfolio overview coming soon"
        description="Managers will see placement health, margins at risk, and aging timesheets."
      />
    </div>
  );
}
