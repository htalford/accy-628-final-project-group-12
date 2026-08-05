import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge, statusTone } from "@/components/ui/status-badge";
import {
  ClientArLink,
  InvoiceLink,
} from "@/components/accounting/entity-links";
import { getAccountsReceivable, getClients } from "@/lib/accounting/queries";
import { money, moneyExact } from "@/lib/accounting/format";
import Link from "next/link";

export default async function AccountsReceivablePage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const params = await searchParams;
  const [{ summary, rows }, clients] = await Promise.all([
    getAccountsReceivable(),
    getClients(),
  ]);

  const filtered =
    params.client && params.client !== "all"
      ? rows.filter((r) => r.clientId === params.client)
      : rows;

  const clientName =
    params.client && params.client !== "all"
      ? clients.find((c) => c.id === params.client)?.name
      : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Accounts Receivable" />

      {clientName ? (
        <p className="text-sm text-[var(--cf-muted)]">
          Filtered to <span className="font-medium text-[var(--cf-ink)]">{clientName}</span>
          .{" "}
          <Link
            href="/accounting/accounts-receivable"
            className="font-medium text-[var(--cf-ink)] hover:underline"
          >
            Clear filter
          </Link>
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Outstanding Balance"
          value={money(summary.outstanding)}
          hint="Open invoices net of completed payments"
          href="/accounting/invoices?status=sent"
        />
        <StatCard
          label="Payments Received"
          value={money(summary.received)}
          hint="Completed payments only"
          href="/accounting/audit-trail?type=payment"
        />
        <StatCard
          label="Overdue Invoices"
          value={String(summary.overdueCount)}
          href="/accounting/invoices?status=overdue"
        />
      </div>

      <DataTable
        rows={filtered}
        rowHref={(row) => `/accounting/invoices/${row.id}`}
        emptyTitle="No open receivables"
        emptyDescription="When invoices are sent, open balances will appear here."
        columns={[
          {
            key: "client",
            header: "Client",
            interactive: true,
            render: (row) => (
              <ClientArLink clientId={row.clientId} name={row.clientName} />
            ),
          },
          {
            key: "invoice",
            header: "Invoice Number",
            interactive: true,
            render: (row) => <InvoiceLink id={row.id} />,
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
