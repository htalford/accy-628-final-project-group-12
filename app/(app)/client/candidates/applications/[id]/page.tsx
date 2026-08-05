import { notFound } from "next/navigation";
import { getApplicationForClient } from "@/lib/client-portal/portal-data";
import { CandidateDetailClient } from "../../[id]/candidate-detail-client";

export default async function ApplicationCandidatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const candidate = await getApplicationForClient(id);
  if (!candidate) notFound();
  return <CandidateDetailClient initial={candidate} />;
}
