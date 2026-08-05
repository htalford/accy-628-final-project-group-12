import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable, StatusPill } from "@/components/candidate/ui";
import {
  formatCurrency,
  formatDate,
  getCandidatePlacements,
  getCandidateTimesheets,
} from "@/lib/candidate/data";

export default async function CandidatePayPage() {
  const [placements, timesheets] = await Promise.all([
    getCandidatePlacements(),
    getCandidateTimesheets(),
  ]);

  const placementById = new Map(placements.map((p) => [p.id, p]));
  const rows = timesheets.map((ts) => {
    const placement = placementById.get(ts.placement_id);
    const rate = Number(placement?.pay_rate ?? 0);
    const regularPay = Number(ts.hours_regular) * rate;
    const overtimePay = Number(ts.hours_overtime) * rate;
    return {
      id: ts.id,
      weekEnding: ts.week_ending_date,
      employer: placement?.clients?.name ?? "Employer",
      rate,
      hours: Number(ts.hours_regular) + Number(ts.hours_overtime),
      amount: regularPay + overtimePay,
      status: ts.status,
    };
  });

  const approvedPay = rows
    .filter((r) => r.status === "approved")
    .reduce((sum, r) => sum + r.amount, 0);
  const pendingPay = rows
    .filter((r) => r.status === "submitted")
    .reduce((sum, r) => sum + r.amount, 0);
  const activeRate =
    placements.find((p) => p.status === "active")?.pay_rate ?? null;

  return (
    <div>
      <PageHeader
        title="Pay"
        description="Estimated earnings from your placements using pay rate × submitted hours."
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Active pay rate"
          value={formatCurrency(activeRate)}
          hint="Hourly for current placement"
        />
        <StatCard
          label="Approved earnings"
          value={formatCurrency(approvedPay)}
        />
        <StatCard
          label="Pending timesheets"
          value={formatCurrency(pendingPay)}
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No pay activity yet"
          description="After you submit timesheets, estimated pay will appear week by week."
        />
      ) : (
        <DataTable
          headers={[
            "Week ending",
            "Employer",
            "Rate",
            "Hours",
            "Est. pay",
            "Timesheet status",
          ]}
        >
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="px-4 py-3">{formatDate(row.weekEnding)}</td>
              <td className="px-4 py-3">{row.employer}</td>
              <td className="px-4 py-3">{formatCurrency(row.rate)}</td>
              <td className="px-4 py-3">{row.hours}</td>
              <td className="px-4 py-3 font-medium">
                {formatCurrency(row.amount)}
              </td>
              <td className="px-4 py-3">
                <StatusPill
                  label={row.status}
                  tone={
                    row.status === "approved"
                      ? "good"
                      : row.status === "rejected"
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
