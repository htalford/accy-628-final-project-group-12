import { PageHeader } from "@/components/ui/page-header";
import { CandidateFiltersPanel } from "@/components/recruiter/candidate-filters";
import { RECRUITER_PAGE_COPY } from "@/components/recruiter/summary-cards";
import { candidateFilterOptions, listCandidates } from "@/lib/recruiter/data";

export default async function CandidatesPage() {
  const [options, rows] = await Promise.all([
    candidateFilterOptions(),
    listCandidates(),
  ]);
  const copy = RECRUITER_PAGE_COPY.candidates;

  return (
    <div>
      <PageHeader
        title="Candidates in Pipeline"
        description={copy.subtitle}
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
