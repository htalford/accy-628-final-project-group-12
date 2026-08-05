import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge, statusTone } from "@/components/ui/status-badge";
import { Panel } from "@/components/accounting/panel";
import {
  ClientArLink,
  ContractLink,
} from "@/components/accounting/entity-links";
import { getExpenses } from "@/lib/accounting/queries";
import {
  EXPENSE_CATEGORIES,
  expenseCategoryLabel,
  expenseStatusLabel,
  money,
  moneyExact,
} from "@/lib/accounting/format";

export default async function ExpensesPage() {
  const expenses = await getExpenses();

  const byCategory = EXPENSE_CATEGORIES.map((cat) => ({
    category: cat,
    total: expenses
      .filter((e) => e.category === cat)
      .reduce((s, e) => s + e.amount, 0),
    count: expenses.filter((e) => e.category === cat).length,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader title="Expenses" />
        <Button disabled>Add Expense</Button>
      </div>

      <Panel title="Categories" description="Agency cost categories">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {byCategory.map((c) => (
            <div
              key={c.category}
              className="rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)] px-3 py-2"
            >
              <p className="text-xs font-medium text-[var(--cf-muted)]">
                {expenseCategoryLabel(c.category)}
              </p>
              <p className="text-sm font-semibold text-[var(--cf-ink)]">
                {money(c.total)}
                <span className="ml-2 text-xs font-normal text-[var(--cf-muted)]">
                  ({c.count})
                </span>
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <DataTable
        rows={expenses}
        emptyTitle="No expenses yet"
        emptyDescription="The expenses table is connected. When your team inserts expenses in Supabase, they will show up here on refresh."
        columns={[
          {
            key: "date",
            header: "Expense Date",
            render: (row) => row.expenseDate,
          },
          {
            key: "category",
            header: "Category",
            render: (row) => expenseCategoryLabel(row.category),
          },
          {
            key: "client",
            header: "Client",
            render: (row) =>
              row.clientName !== "—" ? (
                <ClientArLink clientId={row.clientId} name={row.clientName} />
              ) : (
                "—"
              ),
          },
          {
            key: "placement",
            header: "Placement",
            render: (row) =>
              row.placementId ? (
                <ContractLink id={row.placementId} />
              ) : (
                "—"
              ),
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
                label={expenseStatusLabel(row.status)}
                tone={statusTone(row.status)}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
