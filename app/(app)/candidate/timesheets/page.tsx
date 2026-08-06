import { AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { TimesheetForm } from "@/components/candidate/timesheet-form";
import { DataTable, Panel, StatusPill } from "@/components/candidate/ui";
import {
  formatDate,
  getCandidatePlacements,
  getCandidateTimesheets,
} from "@/lib/candidate/data";

/** Most recent Saturday (common staffing week-ending). */
function currentWeekEndingDate() {
  const d = new Date();
  const day = d.getDay(); // 0 Sun … 6 Sat
  const daysSinceSaturday = (day + 1) % 7;
  d.setDate(d.getDate() - daysSinceSaturday);
  return d.toISOString().slice(0, 10);
}

export default async function CandidateTimesheetsPage() {
  const [placements, timesheets] = await Promise.all([
    getCandidatePlacements(),
    getCandidateTimesheets(),
  ]);

  const hasActivePlacement = placements.some((p) => p.status === "active");
  const weekEnding = currentWeekEndingDate();
  const hasThisWeekTimesheet = timesheets.some(
    (ts) => ts.week_ending_date === weekEnding,
  );
  const needsAction = hasActivePlacement && !hasThisWeekTimesheet;

  return (
    <div>
      {needsAction ? (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-900 shadow-sm"
        >
          <AlertCircle
            className="mt-0.5 h-5 w-5 shrink-0 text-red-600"
            aria-hidden
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold">Timesheet needs action</p>
            <p className="mt-0.5 text-sm text-red-800/90">
              You haven’t submitted hours for week ending{" "}
              <span className="font-semibold">{formatDate(weekEnding)}</span>.
              Submit below to stay current for payroll.
            </p>
          </div>
        </div>
      ) : null}

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
