import { PageHeader } from "@/components/ui/page-header";
import {
  CandidateJobsBoard,
  type CandidateJobRow,
} from "@/components/candidate/jobs-board";
import {
  formatCurrency,
  formatDate,
  getCandidateApplications,
  getCandidateEmployee,
  getCandidateJobInterests,
  getOpenJobs,
} from "@/lib/candidate/data";

export default async function CandidateJobsPage() {
  const [jobs, applications, interests, { employee }] = await Promise.all([
    getOpenJobs(),
    getCandidateApplications(),
    getCandidateJobInterests(),
    getCandidateEmployee(),
  ]);
  const appliedJobIds = new Set(applications.map((a) => a.job_id));
  const interestedJobIds = new Set(interests);
  const profileResumeUrl = employee?.resume_url ?? null;

  const rows: CandidateJobRow[] = jobs.map((job) => {
    const payMin = formatCurrency(job.pay_rate_min);
    const payMax =
      job.pay_rate_max != null ? formatCurrency(job.pay_rate_max) : null;
    const payLabel =
      payMin === "—" && !payMax
        ? "—"
        : payMax
          ? `${payMin} – ${payMax}`
          : payMin;

    return {
      id: job.id,
      title: job.title,
      description: job.description,
      employer: job.employer_name,
      location: job.location ?? "—",
      employmentType: job.employment_type,
      payLabel,
      postedLabel: formatDate(job.posted_at),
      postedAt: job.posted_at,
      applied: appliedJobIds.has(job.id),
      interested: interestedJobIds.has(job.id),
      profileResumeUrl,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Available jobs"
        description="Open roles from TalentQuest employers. Mark jobs you’re interested in, or apply with your profile, cover letter, and/or resume."
      />
      <CandidateJobsBoard jobs={rows} />
    </div>
  );
}
