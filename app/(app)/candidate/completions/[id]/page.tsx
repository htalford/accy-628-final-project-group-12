import { redirect } from "next/navigation";

export default async function CandidateCompletionDetailRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/candidate/contracts/${id}`);
}
