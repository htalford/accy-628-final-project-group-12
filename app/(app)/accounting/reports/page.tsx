import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/accounting/panel";
import { getClients, getDashboardData, getProfitabilityData } from "@/lib/accounting/queries";
import { money } from "@/lib/accounting/format";
import { ReportsFilters } from "@/components/accounting/reports-filters";

const REPORTS = [
  {
    id: "revenue",
    title: "Revenue Report",
    description: "Invoice revenue by period and client.",
  },
  {
    id: "payroll",
    title: "Payroll Report",
    description: "Gross pay from timesheets and pay rates.",
  },
  {
    id: "aging",
    title: "Invoice Aging Report",
    description: "Open invoices by days outstanding.",
  },
  {
    id: "profitability",
    title: "Profitability Report",
    description: "Margin by client and placement.",
  },
  {
    id: "contract-revenue",
    title: "Contract Revenue Report",
    description: "Revenue attributed to placements.",
  },
  {
    id: "expense",
    title: "Expense Report",
    description: "Expenses by category (live when rows exist).",
  },
];

export default async function ReportsPage() {
  const [clients, dash, profit] = await Promise.all([
    getClients(),
    getDashboardData(),
    getProfitabilityData(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial Reports"
        description="Report catalog with live preview metrics. Export buttons are visual only."
      />

      <ReportsFilters clients={clients} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Panel title="Snapshot">
          <p className="text-2xl font-semibold">{money(dash.cards.billedRevenue)}</p>
          <p className="text-xs text-[var(--cf-muted)]">Billed revenue</p>
        </Panel>
        <Panel title="Collected">
          <p className="text-2xl font-semibold">{money(dash.cards.collected)}</p>
          <p className="text-xs text-[var(--cf-muted)]">Completed payments</p>
        </Panel>
        <Panel title="Gross Margin">
          <p className="text-2xl font-semibold">
            {profit.totals.grossMargin.toFixed(1)}%
          </p>
          <p className="text-xs text-[var(--cf-muted)]">Gross profit ÷ billed revenue</p>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {REPORTS.map((report) => (
          <Panel
            key={report.id}
            title={report.title}
            description={report.description}
            action={
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" disabled>
                  PDF
                </Button>
                <Button variant="secondary" disabled>
                  Excel
                </Button>
                <Button variant="secondary" disabled>
                  CSV
                </Button>
              </div>
            }
          >
            <p className="text-sm text-[var(--cf-muted)]">
              Preview uses live Supabase aggregates. Apply date / client /
              recruiter filters above when exporting is implemented.
            </p>
          </Panel>
        ))}
      </div>
    </div>
  );
}
