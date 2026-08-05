import { PageHeader } from "@/components/ui/page-header";
import { JobOrderFiltersPanel } from "@/components/recruiter/job-order-filters";
import { jobOrderFilterOptions, listJobOrders } from "@/lib/recruiter/data";

export default async function JobOrdersPage() {
  const [options, rows] = await Promise.all([
    jobOrderFilterOptions(),
    listJobOrders(),
  ]);

  return (
    <div>
      <PageHeader
        title="Job Orders"
        description="Derived from seeded placements by client and placement type."
      />
      <JobOrderFiltersPanel
        initialRows={rows}
        clients={options.clients}
        statuses={options.statuses}
        locations={options.locations}
        priorities={options.priorities}
      />
    </div>
  );
}
