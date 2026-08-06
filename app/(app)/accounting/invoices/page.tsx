import Link from "next/link";
import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge, statusTone } from "@/components/ui/status-badge";
import {
  ClientArLink,
  ContractLink,
  InvoiceLink,
} from "@/components/accounting/entity-links";
import { getClients, getInvoices } from "@/lib/accounting/queries";
import { moneyExact } from "@/lib/accounting/format";
import { InvoicesToolbar } from "@/components/accounting/invoices-toolbar";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; client?: string }>;
}) {
  const params = await searchParams;
  const [invoices, clients] = await Promise.all([getInvoices(), getClients()]);

  const overdueCount = invoices.filter(
    (inv) => inv.displayStatus === "Overdue",
  ).length;

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
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--cf-ink)]">
            Invoices
          </h1>
          <Link
            href="/accounting/invoices?status=overdue"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:underline"
          >
            <CircleAlert className="h-4 w-4 shrink-0" aria-hidden />
            <span>
              {overdueCount === 1
                ? "1 overdue invoice"
                : `${overdueCount} overdue invoices`}
            </span>
          </Link>
        </div>
        <Button href="/accounting/invoices/new">Create Invoice</Button>
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
            interactive: true,
            render: (row) => <InvoiceLink id={row.id} />,
          },
          {
            key: "client",
            header: "Client",
            interactive: true,
            render: (row) => (
              <ClientArLink clientId={row.clientId} name={row.clientName} />
            ),
          },
          {
            key: "contract",
            header: "Contract",
            interactive: true,
            render: (row) =>
              row.placementId ? (
                <ContractLink id={row.placementId} />
              ) : (
                <span className="text-[var(--cf-muted)]">—</span>
              ),
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
        Tip: invoice numbers, clients, and contracts are linked for drill-down.{" "}
        <Link className="underline" href="/accounting/audit-trail">
          Open audit trail
        </Link>
      </p>
    </div>
  );
}
