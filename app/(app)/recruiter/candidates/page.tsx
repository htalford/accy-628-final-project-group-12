import { listMatchedApplicationsForRecruiter } from "@/lib/client-portal/portal-data";
import { MatchedCandidatesClient } from "./matched-candidates-client";

export default async function CandidatesPage() {
  const candidates = await listMatchedApplicationsForRecruiter();
  return <MatchedCandidatesClient initial={candidates} />;
}
