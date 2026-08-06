import { notFound } from "next/navigation";
import { getApplicationForRecruiter } from "@/lib/client-portal/portal-data";
import { CandidateDetailClient } from "@/app/(app)/client/candidates/[id]/candidate-detail-client";
import { ToastProvider } from "@/components/client-portal/toast";

export default async function RecruiterApplicationCandidatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const candidate = await getApplicationForRecruiter(id);
  if (!candidate) notFound();
  return (
    <ToastProvider>
      <CandidateDetailClient
        initial={candidate}
        listHref="/recruiter/candidates"
        listLabel="Matched candidates"
      />
    </ToastProvider>
  );
}
