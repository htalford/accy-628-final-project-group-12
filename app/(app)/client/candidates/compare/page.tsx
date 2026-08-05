import { listClientCandidates } from "@/lib/client-portal/portal-data";
import { CandidateCompareClient } from "./compare-client";

export default async function CompareCandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids: idsParam } = await searchParams;
  const all = await listClientCandidates();
  const requested = (idsParam ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);

  const byId = new Map(all.map((c) => [c.id, c]));
  const selected = requested
    .map((id) => byId.get(id))
    .filter((c): c is NonNullable<typeof c> => c != null);

  return <CandidateCompareClient candidates={selected} />;
}
