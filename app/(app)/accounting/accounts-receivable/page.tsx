import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge, statusTone } from "@/components/ui/status-badge";
import { getAccountsReceivable } from "@/lib/accounting/queries";
import { money, moneyExact, shortId } from "@/lib/accounting/format";

export default async function AccountsReceivablePage() {
  const { summary, rows } = await getAccountsReceivable();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Accounts Receivable"
        description="Outstanding client balances from open invoices and completed payments."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Outstanding Balance"
          value={money(summary.outstanding)}
          hint="Open invoices net of completed payments"
        />
        <StatCard
          label="Payments Received"
          value={money(summary.received)}
          hint="Completed payments only"
        />
        <StatCard label="Overdue Invoices" value={String(summary.overdueCount)} />
      </div>

      <DataTable
        rows={rows}
        rowHref={(row) => `/accounting/invoices/${row.id}`}
        emptyTitle="No open receivables"
        emptyDescription="When invoices are sent, open balances will appear here."
        columns={[
          {
            key: "client",
            header: "Client",
            render: (row) => row.clientName,
          },
          {
            key: "invoice",
            header: "Invoice Number",
            render: (row) => (
              <span className="font-mono text-xs">{shortId(row.id)}</span>
            ),
          },
          {
            key: "dueAmt",
            header: "Amount Due",
            render: (row) => moneyExact(row.amountDue),
          },
          {
            key: "dueDate",
            header: "Due Date",
            render: (row) => row.dueDate,
          },
          {
            key: "days",
            header: "Days Outstanding",
            render: (row) => String(row.daysOutstanding),
          },
          {
            key: "status",
            header: "Payment Status",
            render: (row) => (
              <StatusBadge
                label={row.paymentStatus}
                tone={statusTone(row.paymentStatus)}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
