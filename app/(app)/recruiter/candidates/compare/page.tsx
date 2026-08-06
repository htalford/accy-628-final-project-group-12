import { listMatchedApplicationsForRecruiter } from "@/lib/client-portal/portal-data";
import { CandidateCompareClient } from "@/app/(app)/client/candidates/compare/compare-client";
import { ToastProvider } from "@/components/client-portal/toast";

export default async function CompareMatchedCandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids: idsParam } = await searchParams;
  const all = await listMatchedApplicationsForRecruiter();
  const requested = (idsParam ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);

  const byId = new Map(all.map((c) => [c.id, c]));
  const selected = requested
    .map((id) => byId.get(id))
    .filter((c): c is NonNullable<typeof c> => c != null)
    .map((c) => ({
      ...c,
      detail_href: `/recruiter/candidates/applications/${c.id}`,
    }));

  return (
    <ToastProvider>
      <CandidateCompareClient
        candidates={selected}
        listHref="/recruiter/candidates"
      />
    </ToastProvider>
  );
}
