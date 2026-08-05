import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ApplyButton } from "@/components/candidate/apply-button";
import { DataTable, StatusPill } from "@/components/candidate/ui";
import {
  formatCurrency,
  formatDate,
  getCandidateApplications,
  getOpenJobs,
} from "@/lib/candidate/data";

export default async function CandidateJobsPage() {
  const [jobs, applications] = await Promise.all([
    getOpenJobs(),
    getCandidateApplications(),
  ]);
  const appliedJobIds = new Set(applications.map((a) => a.job_id));

  return (
    <div>
      <PageHeader
        title="Available jobs"
        description="Open roles from ContractFlow employers. Apply directly from here."
      />
      {jobs.length === 0 ? (
        <EmptyState
          title="No open jobs right now"
          description="Check back soon — recruiters post new openings as clients request coverage."
        />
      ) : (
        <DataTable
          headers={[
            "Role",
            "Employer",
            "Location",
            "Type",
            "Pay range",
            "Posted",
            "",
          ]}
        >
          {jobs.map((job) => (
            <tr key={job.id} className="align-top">
              <td className="px-4 py-3">
                <p className="font-medium text-[var(--cf-ink)]">{job.title}</p>
                <p className="mt-1 max-w-md text-xs text-[var(--cf-muted)]">
                  {job.description}
                </p>
              </td>
              <td className="px-4 py-3">{job.employer_name}</td>
              <td className="px-4 py-3">{job.location ?? "—"}</td>
              <td className="px-4 py-3">
                <StatusPill label={job.employment_type} />
              </td>
              <td className="px-4 py-3">
                {formatCurrency(job.pay_rate_min)}
                {job.pay_rate_max != null
                  ? ` – ${formatCurrency(job.pay_rate_max)}`
                  : ""}
              </td>
              <td className="px-4 py-3">{formatDate(job.posted_at)}</td>
              <td className="px-4 py-3">
                {appliedJobIds.has(job.id) ? (
                  <StatusPill label="Applied" tone="good" />
                ) : (
                  <ApplyButton jobId={job.id} />
                )}
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
