import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { JobOrderDetail } from "@/components/recruiter/job-order-detail";
import {
  getCandidatesByIds,
  getJobOrder,
  listApprovedCandidates,
  listCandidates,
} from "@/lib/recruiter/data";
import {
  candidateInputFromRecruiter,
  jobInputFromRecruiterOrder,
  rankCandidatesForJob,
} from "@/lib/matching";

export default async function JobOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await getJobOrder(id);
  if (!job) notFound();

  const [assignedCandidates, approvedCandidates, allCandidates] =
    await Promise.all([
      getCandidatesByIds(
        job.assignedEmployeeId
          ? [
              ...new Set([
                ...job.assignedCandidateIds,
                job.assignedEmployeeId,
              ]),
            ]
          : job.assignedCandidateIds,
      ),
      listApprovedCandidates(),
      listCandidates(),
    ]);

  // Prefer pool: everyone not already hard-linked; still score full list for ranking.
  const jobInput = jobInputFromRecruiterOrder(job);
  const suggestedMatches = rankCandidatesForJob(
    jobInput,
    allCandidates.map((c) => ({
      id: c.id,
      name: c.name,
      source: c.source,
      input: candidateInputFromRecruiter(c),
    })),
    { minScore: 0, limit: 12 },
  ).filter((m) => {
    // Keep applicants for this job, plus pool matches (including under 60% for review)
    const c = allCandidates.find((x) => x.id === m.candidateId);
    if (!c) return false;
    if (c.jobId === job.id) return true;
    // Surface weak pool fits for recruiter review; still skip empty scores
    return m.result.score > 0;
  });

  const suggestedWithProfiles = suggestedMatches
    .map((m) => {
      const c = allCandidates.find((x) => x.id === m.candidateId);
      if (!c) return null;
      return { candidate: c, result: m.result };
    })
    .filter(Boolean) as Array<{
    candidate: (typeof allCandidates)[0];
    result: (typeof suggestedMatches)[0]["result"];
  }>;

  return (
    <div>
      <PageHeader
        title="Job order details"
        description={`${job.title} at ${job.company}`}
        actions={
          <Link
            href="/recruiter/job-orders"
            className="rounded-lg border border-[var(--cf-border)] bg-white px-3 py-2 text-sm font-medium text-[var(--cf-ink)] shadow-sm hover:bg-[var(--cf-surface)]"
          >
            Back to job orders
          </Link>
        }
      />
      <JobOrderDetail
        job={job}
        assignedCandidates={assignedCandidates}
        approvedCandidates={approvedCandidates}
        suggestedMatches={suggestedWithProfiles}
      />
    </div>
  );
}
