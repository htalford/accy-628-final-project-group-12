import { Suspense } from "react";
import { loadClientPortalData } from "@/lib/client-portal/queries";
import { ContractsClient } from "./contracts-client";

export default async function ContractsPage() {
  const data = await loadClientPortalData();
  return (
    <Suspense fallback={<p className="text-sm text-[var(--cf-muted)]">Loading…</p>}>
      <ContractsClient
        companyName={data.client?.name ?? "your company"}
        placements={data.placements}
      />
    </Suspense>
  );
}
