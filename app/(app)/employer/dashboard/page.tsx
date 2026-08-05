import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";

export default function EmployerDashboardPage() {
  return (
    <div>
      <PageHeader
        title="Employer dashboard"
        description="Active placements at your company and a snapshot of recent billing."
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Active placements" value="—" hint="Wire to placements next" />
        <StatCard label="Open invoices" value="—" hint="Sent / partial / disputed" />
        <StatCard label="Hours this period" value="—" hint="From approved timesheets" />
      </div>
      <EmptyState
        title="Placement & billing summary coming soon"
        description="This page will list your active temp and permanent placements with billing status."
      />
    </div>
  );
}
