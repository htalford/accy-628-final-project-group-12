import { notFound } from "next/navigation";
import { getSubmittalForClient } from "@/lib/client-portal/portal-data";
import { CandidateDetailClient } from "./candidate-detail-client";

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const submittal = await getSubmittalForClient(id);
  if (!submittal) notFound();
  return <CandidateDetailClient initial={submittal} />;
}
