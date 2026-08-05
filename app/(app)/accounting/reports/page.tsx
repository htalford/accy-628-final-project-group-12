import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/accounting/panel";
import {
  getDashboardData,
  getProfitabilityData,
} from "@/lib/accounting/queries";
import { money } from "@/lib/accounting/format";
import {
  DRAFTED_STATEMENTS,
  REPORTS,
  reportPreviewHref,
  type ReportDefinition,
} from "@/lib/accounting/reports";

function ReportCards({ reports }: { reports: ReportDefinition[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {reports.map((report) => (
        <Panel
          key={report.id}
          title={report.title}
          description={report.description}
          action={
            <Button href={reportPreviewHref(report.id)}>Preview</Button>
          }
        >
          {null}
        </Panel>
      ))}
    </div>
  );
}

export default async function ReportsPage() {
  const [dash, profit] = await Promise.all([
    getDashboardData(),
    getProfitabilityData(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Financial Reports" />

      <div className="grid gap-4 sm:grid-cols-3">
        <Panel title="Snapshot">
          <p className="text-2xl font-semibold">
            {money(dash.cards.billedRevenue)}
          </p>
          <p className="text-xs text-[var(--cf-muted)]">Billed revenue</p>
        </Panel>
        <Panel title="Collected">
          <p className="text-2xl font-semibold">
            {money(dash.cards.collected)}
          </p>
          <p className="text-xs text-[var(--cf-muted)]">Completed payments</p>
        </Panel>
        <Panel title="Gross Margin">
          <p className="text-2xl font-semibold">
            {profit.totals.grossMargin.toFixed(1)}%
          </p>
          <p className="text-xs text-[var(--cf-muted)]">
            Gross profit ÷ billed revenue
          </p>
        </Panel>
      </div>

      <ReportCards reports={REPORTS} />

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-[var(--cf-ink)]">
          Drafted Financial Statements
        </h2>
        <ReportCards reports={DRAFTED_STATEMENTS} />
      </div>
    </div>
  );
}
