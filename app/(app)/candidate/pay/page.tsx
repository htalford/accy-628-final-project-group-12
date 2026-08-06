import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import {
  CandidatePayBoard,
  type CandidatePayRow,
} from "@/components/candidate/pay-board";
import {
  formatCurrency,
  getCandidatePlacements,
  getCandidateTimesheets,
} from "@/lib/candidate/data";

export default async function CandidatePayPage() {
  const [placements, timesheets] = await Promise.all([
    getCandidatePlacements(),
    getCandidateTimesheets(),
  ]);

  const placementById = new Map(placements.map((p) => [p.id, p]));
  const rows: CandidatePayRow[] = timesheets.map((ts) => {
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
    <div className="space-y-6">
      <PageHeader
        title="Pay"
        description="Estimated earnings from your placements using pay rate × submitted hours."
      />
      <div className="grid gap-4 sm:grid-cols-3">
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

      <CandidatePayBoard rows={rows} />
    </div>
  );
}
