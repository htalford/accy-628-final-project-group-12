import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { CandidateDetail } from "@/components/recruiter/candidate-detail";
import { getCandidate } from "@/lib/recruiter/data";

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const candidate = await getCandidate(id);
  if (!candidate) notFound();

  return (
    <div>
      <PageHeader
        title="Candidate details"
        description={`${candidate.name} · ${candidate.positionApplied}`}
        actions={
          <Link
            href="/recruiter/candidates"
            className="rounded-lg border border-[var(--cf-border)] bg-white px-3 py-2 text-sm font-medium text-[var(--cf-ink)] shadow-sm hover:bg-[var(--cf-surface)]"
          >
            Back to candidates
          </Link>
        }
      />
      <CandidateDetail candidate={candidate} />
    </div>
  );
}
