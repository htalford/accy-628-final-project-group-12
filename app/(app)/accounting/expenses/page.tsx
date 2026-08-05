import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge, statusTone } from "@/components/ui/status-badge";
import { Panel } from "@/components/accounting/panel";
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

export default async function ExpensesPage() {
  const [placementExpenses, operatingExpenses] = await Promise.all([
    getExpenses(),
    getOperatingExpenses(),
  ]);

  const placementTotal = placementExpenses.reduce((s, e) => s + e.amount, 0);
  const operatingTotal = operatingExpenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title="Expenses"
          description="Direct placement costs and company overhead, tracked separately."
        />
        <Button disabled>Add Expense</Button>
      </div>

      <section className="space-y-4">
        <Panel
          title="Placement Expenses"
          description="Direct costs tied to a placement (payroll tax, benefits, recruiting, travel, etc.)."
          action={
            <span className="text-sm font-semibold text-[var(--cf-ink)]">
              {money(placementTotal)}
            </span>
          }
        >
          <DataTable
            rows={placementExpenses}
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
        </Panel>
      </section>

      <section className="space-y-4">
        <Panel
          title="Operating Expenses"
          description="Company overhead (salaries, rent, software, advertising, screening, training, etc.)."
          action={
            <span className="text-sm font-semibold text-[var(--cf-ink)]">
              {money(operatingTotal)}
            </span>
          }
        >
          <DataTable
            rows={operatingExpenses}
            emptyTitle="No operating expenses yet"
            emptyDescription="When operating expenses are recorded in Supabase, they appear here."
            columns={[
              {
                key: "date",
                header: "Expense Date",
                render: (row) => row.expenseDate,
              },
              {
                key: "month",
                header: "Month",
                render: (row) => row.month,
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
        </Panel>
      </section>
    </div>
  );
}
