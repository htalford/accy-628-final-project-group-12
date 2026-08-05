import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";

export default function AccountingDashboardPage() {
  return (
    <div>
      <PageHeader
        title="Contract-to-cash dashboard"
        description="Earned vs. billed vs. paid, plus margin visibility by placement."
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Earned" value="—" hint="Approved hours × bill rate + fees" />
        <StatCard label="Billed" value="—" hint="Invoice amounts sent" />
        <StatCard label="Collected" value="—" hint="Completed payments" />
      </div>
      <EmptyState
        title="C2C metrics coming soon"
        description="Accounting will compare earned, billed, and paid with margin by placement."
      />
    </div>
  );
}
