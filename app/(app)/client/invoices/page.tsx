import { Suspense } from "react";
import { loadClientPortalData } from "@/lib/client-portal/queries";
import { InvoicesClient } from "./invoices-client";

export default async function InvoicesPage() {
  const data = await loadClientPortalData();
  return (
    <Suspense fallback={<p className="text-sm text-[var(--cf-muted)]">Loading…</p>}>
      <InvoicesClient
        companyName={data.client?.name ?? "your company"}
        invoices={data.invoices}
      />
    </Suspense>
  );
}
