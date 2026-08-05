import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export default function AccountingInvoicesPage() {
  return (
    <div>
      <PageHeader
        title="Invoices"
        description="Draft, send, and track invoices and related payments."
      />
      <EmptyState
        title="Invoice list placeholder"
        description="Invoice status, amounts, periods, and payment progress will appear here."
      />
    </div>
  );
}
