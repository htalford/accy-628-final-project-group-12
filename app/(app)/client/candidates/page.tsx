import { listClientCandidates } from "@/lib/client-portal/portal-data";
import { CandidatesClient } from "./candidates-client";

export default async function CandidatesPage() {
  const candidates = await listClientCandidates();
  return <CandidatesClient initial={candidates} />;
}
