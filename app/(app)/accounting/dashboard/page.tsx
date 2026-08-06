import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Panel } from "@/components/accounting/panel";
import {
  InvoiceStatusChart,
  RevenueChart,
} from "@/components/accounting/charts";
import { getDashboardData } from "@/lib/accounting/queries";
import { money } from "@/lib/accounting/format";
import { daysAgoIso } from "@/lib/accounting/calculations";

export default async function AccountingHomePage() {
  const data = await getDashboardData();
  const from = daysAgoIso(30);

  return (
    <div className="space-y-6">
      <PageHeader title="Home" />

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
          label="Payroll (Last 30 Days)"
          value={money(data.cards.payrollLast30Days)}
          hint="Approved timesheets in the last 30 days"
          href={`/accounting/payroll?status=approved&from=${from}`}
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

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          compact
          label="Collected"
          value={money(data.cards.collected)}
          hint="Completed payments only"
          href="/accounting/accounts-receivable"
        />
        <StatCard
          compact
          label="Active Contracts"
          value={String(data.cards.activeContracts)}
          hint="Active placements"
          href="/accounting/contracts"
        />
        <StatCard
          compact
          label="Gross Margin"
          value={`${data.cards.grossMarginPercent.toFixed(1)}%`}
          hint="Gross profit ÷ billed revenue"
          href="/accounting/profitability"
        />
        <StatCard
          compact
          label="Timesheets Awaiting Approval"
          value={String(data.cards.timesheetsAwaitingApproval)}
          hint="Submitted timesheets pending review"
          href="/accounting/timesheets?status=submitted"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Revenue Overview"
          description="Billed amounts by invoice period month"
          action={
            <Link
              href="/accounting/invoices"
              className="text-sm font-medium text-[var(--cf-ink)] hover:underline"
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
          description="Same statuses as the Invoices list (drafts excluded)"
          action={
            <Link
              href="/accounting/invoices"
              className="text-sm font-medium text-[var(--cf-ink)] hover:underline"
            >
              Open Invoices →
            </Link>
          }
        >
          <Link href="/accounting/invoices" className="block">
            <InvoiceStatusChart data={data.invoiceStatusChart} />
          </Link>
        </Panel>
      </div>

      <Panel
        title="Recent Financial Activity"
        action={
          <Link
            href="/accounting/audit-trail"
            className="text-sm font-medium text-[var(--cf-accent)] hover:underline"
          >
            Full audit trail →
          </Link>
        }
      >
        <ul className="divide-y divide-[var(--cf-border)]">
          {data.activity.length === 0 ? (
            <li className="py-6 text-sm text-[var(--cf-muted)]">No recent activity.</li>
          ) : (
            data.activity.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
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
            ))
          )}
        </ul>
      </Panel>
    </div>
  );
}
