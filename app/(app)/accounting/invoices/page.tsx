import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge, statusTone } from "@/components/ui/status-badge";
import { getClients, getInvoices } from "@/lib/accounting/queries";
import { moneyExact, shortId } from "@/lib/accounting/format";
import { InvoicesToolbar } from "@/components/accounting/invoices-toolbar";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; client?: string }>;
}) {
  const params = await searchParams;
  const [invoices, clients] = await Promise.all([getInvoices(), getClients()]);

  const filtered = invoices.filter((inv) => {
    if (params.status && params.status !== "all") {
      if (params.status === "overdue") {
        if (inv.displayStatus !== "Overdue") return false;
      } else if (inv.status !== params.status) return false;
    }
    if (params.client && params.client !== "all" && inv.clientId !== params.client)
      return false;
    if (params.q) {
      const q = params.q.toLowerCase();
      const hay = `${inv.clientName} ${inv.id} ${inv.displayStatus}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title="Invoices"
          description="Manage client invoices synced from Supabase."
        />
        <Button disabled>Create Invoice</Button>
      </div>

      <InvoicesToolbar clients={clients} />

      <DataTable
        rows={filtered}
        rowHref={(row) => `/accounting/invoices/${row.id}`}
        emptyTitle="No invoices match"
        emptyDescription="Adjust filters or seed invoices in Supabase."
        columns={[
          {
            key: "number",
            header: "Invoice Number",
            render: (row) => (
              <span className="font-mono text-xs">{shortId(row.id)}</span>
            ),
          },
          {
            key: "client",
            header: "Client",
            render: (row) => row.clientName,
          },
          {
            key: "period",
            header: "Billing Period",
            render: (row) => `${row.periodStart} → ${row.periodEnd}`,
          },
          {
            key: "invoiceDate",
            header: "Invoice Date",
            render: (row) => row.invoiceDate,
          },
          {
            key: "due",
            header: "Due Date",
            render: (row) => row.dueDate,
          },
          {
            key: "amount",
            header: "Amount",
            render: (row) => moneyExact(row.amount),
          },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <StatusBadge
                label={row.displayStatus}
                tone={statusTone(row.displayStatus)}
              />
            ),
          },
        ]}
      />
      <p className="text-xs text-[var(--cf-muted)]">
        Tip: open a row for client info, line items, and payment history.{" "}
        <Link className="underline" href="/accounting/dashboard">
          Back to dashboard
        </Link>
      </p>
    </div>
  );
}
