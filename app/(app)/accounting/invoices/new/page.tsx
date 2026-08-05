import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { CreateInvoiceForm } from "@/components/accounting/create-invoice-form";
import { getClients, getContracts } from "@/lib/accounting/queries";

export default async function CreateInvoicePage() {
  const [clients, contracts] = await Promise.all([getClients(), getContracts()]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/accounting/invoices"
          className="text-sm font-medium text-[var(--cf-ink)] hover:underline"
        >
          ← Back to invoices
        </Link>
        <PageHeader title="Create Invoice" />
      </div>

      {clients.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--cf-border)] bg-white px-6 py-10 text-center text-sm text-[var(--cf-muted)]">
          No clients found. Add a client in Supabase before creating an invoice.
        </p>
      ) : (
        <CreateInvoiceForm
          clients={clients.map((c) => ({ id: c.id, name: c.name }))}
          contracts={contracts.map((c) => ({
            id: c.id,
            clientId: c.clientId,
            clientName: c.clientName,
            employeeName: c.employeeName,
            billRate: c.billRate,
            status: c.status,
          }))}
        />
      )}
    </div>
  );
}
