import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/accounting/panel";
import {
  InvoiceStatusChart,
  RevenueChart,
} from "@/components/accounting/charts";
import { getDashboardData } from "@/lib/accounting/queries";
import { money } from "@/lib/accounting/format";

export default async function AccountingHomePage() {
  const data = await getDashboardData();
  const statusData = Object.entries(data.statusCounts).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Home"
        description="Accrual overview — click any metric or section to open the related accounting page."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Earned Revenue"
          value={money(data.cards.earnedRevenue)}
          hint="Approved hours × bill rate (OT @ 1.5×)"
          href="/accounting/payroll"
        />
        <StatCard
          label="Billed Revenue"
          value={money(data.cards.billedRevenue)}
          hint="Recognized invoices (excludes drafts)"
          href="/accounting/invoices"
        />
        <StatCard
          label="Accounts Receivable"
          value={money(data.cards.outstandingInvoices)}
          hint="Open invoices net of completed payments"
          href="/accounting/accounts-receivable"
        />
        <StatCard
          label="Payroll (This Month)"
          value={money(data.cards.payrollThisMonth)}
          hint="Approved timesheets in current month"
          href="/accounting/payroll"
        />
        <StatCard
          label="Gross Profit"
          value={money(data.cards.grossProfit)}
          hint="Billed revenue − direct labor (COS)"
          href="/accounting/profitability"
        />
        <StatCard
          label="Operating Income"
          value={money(data.cards.operatingIncome)}
          hint="Gross profit − recognized operating expenses"
          href="/accounting/expenses"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Collected"
          value={money(data.cards.collected)}
          hint="Completed payments only"
          href="/accounting/accounts-receivable"
        />
        <StatCard
          label="Active Contracts"
          value={String(data.cards.activeContracts)}
          hint="Active placements"
          href="/accounting/contracts"
        />
        <StatCard
          label="Gross Margin"
          value={`${data.cards.grossMarginPercent.toFixed(1)}%`}
          hint="Gross profit ÷ billed revenue"
          href="/accounting/profitability"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Revenue Overview"
          description="Billed amounts by invoice period month"
          action={
            <Link
              href="/accounting/invoices"
              className="text-sm font-medium text-[var(--cf-accent)] hover:underline"
            >
              Open Invoices →
            </Link>
          }
        >
          <Link href="/accounting/invoices" className="block">
            <RevenueChart data={data.revenueByMonth} />
          </Link>
        </Panel>
        <Panel
          title="Invoice Status"
          description="Recognized invoices only (drafts excluded)"
          action={
            <Link
              href="/accounting/invoices"
              className="text-sm font-medium text-[var(--cf-accent)] hover:underline"
            >
              Open Invoices →
            </Link>
          }
        >
          <Link href="/accounting/invoices" className="block">
            <InvoiceStatusChart data={statusData} />
          </Link>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Panel
          title="Recent Financial Activity"
          action={
            <Link
              href="/accounting/accounts-receivable"
              className="text-sm font-medium text-[var(--cf-accent)] hover:underline"
            >
              Open AR →
            </Link>
          }
        >
          <ul className="divide-y divide-[var(--cf-border)]">
            {data.activity.length === 0 ? (
              <li className="py-6 text-sm text-[var(--cf-muted)]">No recent activity.</li>
            ) : (
              data.activity.map((item) => {
                const href = item.id.startsWith("inv-")
                  ? `/accounting/invoices/${item.id.replace("inv-", "")}`
                  : "/accounting/accounts-receivable";
                return (
                  <li key={item.id}>
                    <Link
                      href={href}
                      className="flex items-center justify-between gap-3 py-3 transition hover:bg-[var(--cf-surface)]"
                    >
                      <div>
                        <p className="text-sm font-medium text-[var(--cf-ink)]">
                          {item.label}
                        </p>
                        <p className="text-xs text-[var(--cf-muted)]">{item.at}</p>
                      </div>
                      <p className="text-sm font-semibold text-[var(--cf-ink)]">
                        {item.detail}
                      </p>
                    </Link>
                  </li>
                );
              })
            )}
          </ul>
        </Panel>
        <Panel title="Quick Actions" description="Jump to common accounting workflows">
          <div className="flex flex-col gap-2">
            <Button href="/accounting/invoices">Invoices</Button>
            <Button href="/accounting/payroll" variant="secondary">
              Payroll
            </Button>
            <Button href="/accounting/accounts-receivable" variant="secondary">
              Accounts Receivable
            </Button>
            <Button href="/accounting/expenses" variant="secondary">
              Expenses
            </Button>
            <Button href="/accounting/reports" variant="secondary">
              Financial Reports
            </Button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
