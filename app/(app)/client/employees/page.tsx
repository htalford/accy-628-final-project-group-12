import {
  employeesFromPlacements,
  loadClientPortalData,
} from "@/lib/client-portal/queries";
import { EmployeesListClient } from "./employees-list-client";

export default async function EmployeesPage() {
  const data = await loadClientPortalData();
  const rows = employeesFromPlacements(data.placements).map((e) => {
    const latest = data.timesheets.find((t) => t.placement_id === e.placementId);
    return {
      ...e,
      hoursThisPeriod: latest
        ? latest.hours_regular + latest.hours_overtime
        : 0,
    };
  });

  return (
    <EmployeesListClient
      companyName={data.client?.name ?? "your company"}
      rows={rows}
    />
  );
}
