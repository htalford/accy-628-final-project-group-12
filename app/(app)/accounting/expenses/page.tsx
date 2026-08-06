import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge, statusTone } from "@/components/ui/status-badge";
import { CollapsiblePanel } from "@/components/accounting/collapsible-panel";
import { ScrollToFocus } from "@/components/accounting/scroll-to-focus";
import {
  ClientArLink,
  ContractLink,
} from "@/components/accounting/entity-links";
import {
  getExpenses,
  getOperatingExpenses,
} from "@/lib/accounting/queries";
import {
  expenseStatusLabel,
  expenseTypeLabel,
  money,
  moneyExact,
  operatingExpenseCategoryLabel,
} from "@/lib/accounting/format";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string }>;
}) {
  const { focus } = await searchParams;
  const [placementExpenses, operatingExpenses] = await Promise.all([
    getExpenses(),
    getOperatingExpenses(),
  ]);

  const placementTotal = placementExpenses.reduce((s, e) => s + e.amount, 0);
  const operatingTotal = operatingExpenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-8">
      <ScrollToFocus focusId={focus} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader title="Expenses" />
        <Button href="/accounting/expenses/new">Add Expense</Button>
      </div>

      <CollapsiblePanel
        id="placement"
        title="Placement Expenses"
        defaultOpen={placementExpenses.length > 0}
        action={
          <span className="text-sm font-semibold text-[var(--cf-ink)]">
            {money(placementTotal)}
          </span>
        }
      >
        <DataTable
          rows={placementExpenses}
          rowHtmlId={(row) => `expense-${row.id}`}
          rowClassName={(row) =>
            focus === row.id
              ? "bg-[var(--cf-accent)]/10 ring-2 ring-inset ring-[var(--cf-accent)]"
              : undefined
          }
          emptyTitle="No placement expenses yet"
          emptyDescription="When placement-linked expenses are recorded in Supabase, they appear here."
          columns={[
            {
              key: "date",
              header: "Expense Date",
              render: (row) => row.expenseDate,
            },
            {
              key: "type",
              header: "Type",
              render: (row) => expenseTypeLabel(row.expenseType),
            },
            {
              key: "description",
              header: "Description",
              render: (row) => row.description,
            },
            {
              key: "client",
              header: "Client",
              render: (row) =>
                row.clientName !== "—" ? (
                  <ClientArLink
                    clientId={row.clientId}
                    name={row.clientName}
                  />
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
      </CollapsiblePanel>

      <CollapsiblePanel
        id="operating"
        title="Operating Expenses"
        defaultOpen={operatingExpenses.length > 0}
        action={
          <span className="text-sm font-semibold text-[var(--cf-ink)]">
            {money(operatingTotal)}
          </span>
        }
      >
        <DataTable
          rows={operatingExpenses}
          rowHtmlId={(row) => `expense-${row.id}`}
          rowClassName={(row) =>
            focus === row.id
              ? "bg-[var(--cf-accent)]/10 ring-2 ring-inset ring-[var(--cf-accent)]"
              : undefined
          }
          emptyTitle="No operating expenses yet"
          emptyDescription="When operating expenses are recorded in Supabase, they appear here."
          columns={[
            {
              key: "date",
              header: "Expense Date",
              render: (row) => row.expenseDate,
            },
            {
              key: "category",
              header: "Category",
              render: (row) =>
                operatingExpenseCategoryLabel(row.category),
            },
            {
              key: "description",
              header: "Description",
              render: (row) => row.description,
            },
            {
              key: "amount",
              header: "Amount",
              render: (row) => moneyExact(row.amount),
            },
          ]}
        />
      </CollapsiblePanel>
    </div>
  );
}
