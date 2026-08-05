import { listSubmittalsForClient } from "@/lib/client-portal/portal-data";
import { CandidatesClient } from "./candidates-client";

export default async function CandidatesPage() {
  const submittals = await listSubmittalsForClient();
  return <CandidatesClient initial={submittals} />;
}
