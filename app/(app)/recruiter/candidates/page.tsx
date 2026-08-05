import { PageHeader } from "@/components/ui/page-header";
import { CandidateFiltersPanel } from "@/components/recruiter/candidate-filters";
import { candidateFilterOptions, listCandidates } from "@/lib/recruiter/data";

export default async function CandidatesPage() {
  const [options, rows] = await Promise.all([
    candidateFilterOptions(),
    listCandidates(),
  ]);

  return (
    <div>
      <PageHeader
        title="Candidates in Pipeline"
        description="Live talent pool from seeded employees and placements."
      />
      <CandidateFiltersPanel
        initialRows={rows}
        statuses={options.statuses}
        locations={options.locations}
        recruiters={options.recruiters}
        skills={options.skills}
      />
    </div>
  );
}
