import { PageHeader } from "@/components/ui/page-header";
import { JobOrderFiltersPanel } from "@/components/recruiter/job-order-filters";
import { RECRUITER_PAGE_COPY } from "@/components/recruiter/summary-cards";
import { jobOrderFilterOptions, listJobOrders } from "@/lib/recruiter/data";

export default async function JobOrdersPage() {
  const [options, rows] = await Promise.all([
    jobOrderFilterOptions(),
    listJobOrders(),
  ]);
  const copy = RECRUITER_PAGE_COPY.jobOrders;

  return (
    <div>
      <PageHeader title="Job Orders" description={copy.subtitle} />
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
