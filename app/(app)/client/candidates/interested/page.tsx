import { listInterestedCandidatesForClient } from "@/lib/client-portal/portal-data";
import { InterestedCandidatesClient } from "./interested-client";

export default async function InterestedCandidatesPage() {
  const rows = await listInterestedCandidatesForClient();
  return <InterestedCandidatesClient initial={rows} />;
}
