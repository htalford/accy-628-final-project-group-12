import { Suspense } from "react";
import { loadClientPortalData } from "@/lib/client-portal/queries";
import { TimesheetsClient } from "./timesheets-client";

export default async function TimesheetsPage() {
  const data = await loadClientPortalData();
  const employeeNames = Array.from(
    new Set(data.timesheets.map((t) => t.employee_name)),
  ).sort();

  return (
    <Suspense fallback={<p className="text-sm text-[var(--cf-muted)]">Loading…</p>}>
      <TimesheetsClient
        companyName={data.client?.name ?? "your company"}
        timesheets={data.timesheets}
        employeeNames={employeeNames}
      />
    </Suspense>
  );
}
