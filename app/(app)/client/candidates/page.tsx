import {
  listClientCandidates,
  listLikedApplicationIdsForClient,
} from "@/lib/client-portal/portal-data";
import { CandidatesClient } from "./candidates-client";

export default async function CandidatesPage() {
  const [candidates, likedIds] = await Promise.all([
    listClientCandidates(),
    listLikedApplicationIdsForClient(),
  ]);
  return (
    <CandidatesClient initial={candidates} initialLikedIds={likedIds} />
  );
}
