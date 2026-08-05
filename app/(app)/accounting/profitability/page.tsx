import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Panel } from "@/components/accounting/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  HorizontalProfitBars,
  ProfitTrendChart,
} from "@/components/accounting/charts";
import { getProfitabilityData } from "@/lib/accounting/queries";
import { money } from "@/lib/accounting/format";

export default async function ProfitabilityPage() {
  const data = await getProfitabilityData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profitability"
        description="Margin analytics computed from placements, invoices, payroll, and expenses."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Billed Revenue" value={money(data.totals.revenue)} hint="Excludes draft invoices" />
        <StatCard
          label="Direct Labor (COS)"
          value={money(data.totals.directLabor)}
          hint="Approved timesheets only"
        />
        <StatCard
          label="Gross Margin"
          value={`${data.totals.grossMargin.toFixed(1)}%`}
          hint="Gross profit ÷ billed revenue"
        />
        <StatCard
          label="Operating Income"
          value={money(data.totals.operatingIncome)}
          hint="After recognized operating expenses"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Profit by Client">
          <HorizontalProfitBars
            data={data.profitByClient.map((r) => ({
              name: r.name,
              profit: r.profit,
            }))}
          />
        </Panel>
        <Panel title="Profit by Recruiter">
          <p className="mb-3 text-xs text-[var(--cf-muted)]">
            Placements are not attributed to individual recruiters in the
            database, so this shows agency gross profit rather than an
            allocated estimate.
          </p>
          <HorizontalProfitBars
            data={data.profitByRecruiter.map((r) => ({
              name: r.name,
              profit: r.profit,
            }))}
          />
        </Panel>
      </div>

      <Panel
        title="Profit by Placement"
        description="Invoice revenue linked to each placement. At Risk when margin is 5% or less."
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs tracking-wide text-[var(--cf-muted)] uppercase">
              <tr>
                <th className="py-2 pr-4">Placement</th>
                <th className="py-2 pr-4">Revenue</th>
                <th className="py-2 pr-4">Margin / hr</th>
                <th className="py-2 pr-4">Margin %</th>
                <th className="py-2 pr-4">Fee</th>
                <th className="py-2">At Risk</th>
              </tr>
            </thead>
            <tbody>
              {data.profitByPlacement.map((p) => (
                <tr key={p.id} className="border-t border-[var(--cf-border)]">
                  <td className="py-2 pr-4">{p.label}</td>
                  <td className="py-2 pr-4">{money(p.revenue)}</td>
                  <td className="py-2 pr-4">{money(p.marginPerHour)}</td>
                  <td className="py-2 pr-4">
                    {p.marginPercent != null
                      ? `${p.marginPercent.toFixed(1)}%`
                      : "—"}
                  </td>
                  <td className="py-2 pr-4">{money(p.fee)}</td>
                  <td className="py-2">
                    {p.isCritical ? (
                      <StatusBadge label="At Risk" tone="danger" />
                    ) : (
                      <span className="text-[var(--cf-muted)]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Monthly Profit Trends">
        <ProfitTrendChart data={data.monthly} />
      </Panel>
    </div>
  );
}
