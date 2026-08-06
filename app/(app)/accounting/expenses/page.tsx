import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge, statusTone } from "@/components/ui/status-badge";
import { CollapsiblePanel } from "@/components/accounting/collapsible-panel";
import { ScrollToFocus } from "@/components/accounting/scroll-to-focus";
import {
  ClientArLink,
  ContractLink,
  EntityLink,
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
import { isPayrollOperatingCategory } from "@/lib/accounting/payroll-expenses";

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

  const payrollOperatingExpenses = operatingExpenses.filter((e) =>
    isPayrollOperatingCategory(e.category),
  );
  const otherOperatingExpenses = operatingExpenses.filter(
    (e) => !isPayrollOperatingCategory(e.category),
  );

  const placementTotal = placementExpenses.reduce((s, e) => s + e.amount, 0);
  const payrollOperatingTotal = payrollOperatingExpenses.reduce(
    (s, e) => s + e.amount,
    0,
  );
  const otherOperatingTotal = otherOperatingExpenses.reduce(
    (s, e) => s + e.amount,
    0,
  );

  return (
    <div className="space-y-8">
      <ScrollToFocus focusId={focus} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader title="Expenses" />
        <div className="flex flex-wrap gap-2">
          <Button href="/accounting/payroll" variant="secondary">
            Open Payroll
          </Button>
          <Button href="/accounting/expenses/new">Add Expense</Button>
        </div>
      </div>

      <CollapsiblePanel
        id="payroll"
        title="Payroll Expenses"
        description="Staff salaries — also shown on the Payroll page."
        defaultOpen={payrollOperatingExpenses.length > 0}
        action={
          <span className="flex items-center gap-3 text-sm">
            <Link
              href="/accounting/payroll#staff-payroll-expenses"
              className="font-medium text-[var(--cf-ink)] hover:underline"
            >
              View on Payroll →
            </Link>
            <span className="font-semibold text-[var(--cf-ink)]">
              {money(payrollOperatingTotal)}
            </span>
          </span>
        }
      >
        <DataTable
          rows={payrollOperatingExpenses}
          rowHtmlId={(row) => `expense-${row.id}`}
          rowClassName={(row) =>
            focus === row.id
              ? "bg-[var(--cf-accent)]/10 ring-2 ring-inset ring-[var(--cf-accent)]"
              : undefined
          }
          emptyTitle="No staff payroll expenses"
          emptyDescription="Recruiter/accounting salaries and payroll wages appear here and on Payroll."
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
              key: "tied",
              header: "Tied to",
              render: () => (
                <EntityLink href="/accounting/payroll#staff-payroll-expenses">
                  Payroll
                </EntityLink>
              ),
            },
            {
              key: "amount",
              header: "Amount",
              render: (row) => moneyExact(row.amount),
            },
          ]}
        />
      </CollapsiblePanel>

      <CollapsiblePanel
        id="placement"
        title="Placement Expenses"
        description="Direct costs tied to a placement (payroll tax, benefits, recruiting, travel, etc.)."
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
        title="Other Operating Expenses"
        description="Company overhead excluding payroll salaries and wages (rent, software, advertising, etc.)."
        defaultOpen={otherOperatingExpenses.length > 0}
        action={
          <span className="text-sm font-semibold text-[var(--cf-ink)]">
            {money(otherOperatingTotal)}
          </span>
        }
      >
        <DataTable
          rows={otherOperatingExpenses}
          rowHtmlId={(row) => `expense-${row.id}`}
          rowClassName={(row) =>
            focus === row.id
              ? "bg-[var(--cf-accent)]/10 ring-2 ring-inset ring-[var(--cf-accent)]"
              : undefined
          }
          emptyTitle="No other operating expenses"
          emptyDescription="Non-payroll operating expenses appear here."
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
      </CollapsiblePanel>
    </div>
  );
}
