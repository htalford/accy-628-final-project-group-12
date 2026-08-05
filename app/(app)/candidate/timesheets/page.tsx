import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { TimesheetForm } from "@/components/candidate/timesheet-form";
import { DataTable, Panel, StatusPill } from "@/components/candidate/ui";
import {
  formatDate,
  getCandidatePlacements,
  getCandidateTimesheets,
} from "@/lib/candidate/data";

export default async function CandidateTimesheetsPage() {
  const [placements, timesheets] = await Promise.all([
    getCandidatePlacements(),
    getCandidateTimesheets(),
  ]);

  return (
    <div>
      <PageHeader
        title="Timesheets"
        description="Enter regular and overtime hours for your active placement."
      />
      <div className="mb-6">
        <Panel title="Submit hours">
          <TimesheetForm placements={placements} />
        </Panel>
      </div>

      {timesheets.length === 0 ? (
        <EmptyState
          title="No timesheets submitted yet"
          description="Submitted weeks will show here with approval status."
        />
      ) : (
        <DataTable
          headers={[
            "Week ending",
            "Regular",
            "Overtime",
            "Total",
            "Status",
          ]}
        >
          {timesheets.map((ts) => (
            <tr key={ts.id}>
              <td className="px-4 py-3">{formatDate(ts.week_ending_date)}</td>
              <td className="px-4 py-3">{ts.hours_regular}</td>
              <td className="px-4 py-3">{ts.hours_overtime}</td>
              <td className="px-4 py-3">
                {Number(ts.hours_regular) + Number(ts.hours_overtime)}
              </td>
              <td className="px-4 py-3">
                <StatusPill
                  label={ts.status}
                  tone={
                    ts.status === "approved"
                      ? "good"
                      : ts.status === "rejected" || ts.status === "disputed"
                        ? "bad"
                        : "warn"
                  }
                />
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
