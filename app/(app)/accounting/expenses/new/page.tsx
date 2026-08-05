import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { CreateExpenseForm } from "@/components/accounting/create-expense-form";
import { getContracts } from "@/lib/accounting/queries";

export default async function CreateExpensePage() {
  const contracts = await getContracts();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/accounting/expenses"
          className="text-sm font-medium text-[var(--cf-ink)] hover:underline"
        >
          ← Back to expenses
        </Link>
        <PageHeader title="Add Expense" />
      </div>

      <CreateExpenseForm
        contracts={contracts.map((c) => ({
          id: c.id,
          clientName: c.clientName,
          employeeName: c.employeeName,
        }))}
      />
    </div>
  );
}
