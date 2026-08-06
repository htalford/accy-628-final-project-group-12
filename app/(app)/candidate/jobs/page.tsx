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
import {
  candidateInputFromEmployee,
  jobInputFromPublicJob,
  rankJobsForCandidate,
  requirementsForPublicJobs,
} from "@/lib/matching";

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

  const reqMap = await requirementsForPublicJobs(jobs.map((j) => j.id));
  const candidateProfile = candidateInputFromEmployee(employee, {
    titles: jobs
      .filter((j) => appliedJobIds.has(j.id))
      .map((j) => j.title)
      .slice(0, 5),
  });

  const ranked = rankJobsForCandidate(
    jobs.map((j) => {
      const req = reqMap.get(j.id) ?? { skills: [], certifications: [] };
      return jobInputFromPublicJob(j, req.skills, req.certifications);
    }),
    jobs.map((j) => j.id),
    candidateProfile,
  );
  const scoreByJob = new Map(
    ranked.map((r) => [r.jobId, r.result] as const),
  );

  // Best matches first; already-applied sink lower within equal sorting via secondary key.
  const jobsSorted = [...jobs].sort((a, b) => {
    const sa = scoreByJob.get(a.id)?.score ?? 0;
    const sb = scoreByJob.get(b.id)?.score ?? 0;
    if (sb !== sa) return sb - sa;
    return (
      new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime()
    );
  });

  const rows: CandidateJobRow[] = jobsSorted.map((job) => {
    const payMin = formatCurrency(job.pay_rate_min);
    const payMax =
      job.pay_rate_max != null ? formatCurrency(job.pay_rate_max) : null;
    const payLabel =
      payMin === "—" && !payMax
        ? "—"
        : payMax
          ? `${payMin} – ${payMax}`
          : payMin;
    const match = scoreByJob.get(job.id);

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
      matchScore: match?.score ?? 0,
      matchBand: match?.band ?? "low",
      matchReasons: match?.reasons ?? [],
      matchSkills: match?.skillHits ?? [],
      matchCerts: match?.certHits ?? [],
    };
  });

  const strongCount = rows.filter(
    (r) => !r.applied && (r.matchScore ?? 0) >= 50,
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Available jobs"
        description={
          strongCount > 0
            ? `Open roles ranked for you automatically. ${strongCount} solid match${strongCount === 1 ? "" : "es"} based on your certifications, education, work history, and resume.`
            : "Open roles ranked by how well they fit your profile. Add certifications, education, previous roles, and a resume for better matches."
        }
      />
      <CandidateJobsBoard jobs={rows} />
    </div>
  );
}
