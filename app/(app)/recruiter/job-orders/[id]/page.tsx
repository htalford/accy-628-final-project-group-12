import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { JobOrderDetail } from "@/components/recruiter/job-order-detail";
import {
  getCandidatesByIds,
  getJobOrder,
  listApprovedCandidates,
} from "@/lib/recruiter/data";

export default async function JobOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await getJobOrder(id);
  if (!job) notFound();

  const [assignedCandidates, approvedCandidates] = await Promise.all([
    getCandidatesByIds(
      job.assignedEmployeeId
        ? [...new Set([...job.assignedCandidateIds, job.assignedEmployeeId])]
        : job.assignedCandidateIds,
    ),
    listApprovedCandidates(),
  ]);

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
      />
    </div>
  );
}
