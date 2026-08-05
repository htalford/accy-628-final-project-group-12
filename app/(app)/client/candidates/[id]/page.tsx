import { notFound } from "next/navigation";
import { getClientCandidate } from "@/lib/client-portal/portal-data";
import { CandidateDetailClient } from "./candidate-detail-client";

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const candidate = await getClientCandidate(id, "submittal");
  if (!candidate) notFound();
  return <CandidateDetailClient initial={candidate} />;
}
