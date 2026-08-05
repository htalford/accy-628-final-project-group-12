import { Suspense } from "react";
import { listJobRequestsForClient } from "@/lib/client-portal/portal-data";
import { JobRequestsClient } from "./job-requests-client";

export default async function JobRequestsPage() {
  const requests = await listJobRequestsForClient();
  return (
    <Suspense
      fallback={
        <p className="text-sm text-[var(--cf-muted)]">Loading job requests…</p>
      }
    >
      <JobRequestsClient initial={requests} />
    </Suspense>
  );
}
