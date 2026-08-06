import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge, statusTone } from "@/components/ui/status-badge";
import { CollapsiblePanel } from "@/components/accounting/collapsible-panel";
import { ScrollToFocus } from "@/components/accounting/scroll-to-focus";
import { ExpensesToolbar } from "@/components/accounting/expenses-toolbar";
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
import { isPayrollOperatingCategory, isStaffedEmployeeBenefitsType } from "@/lib/accounting/payroll-expenses";
import { rangeCutoff } from "@/lib/accounting/date-range-filter";
import {
  isPlacementCategoryFilter,
  operatingDbValuesForFilter,
  placementDbValuesForFilter,
  usedExpenseCategoryOptions,
} from "@/lib/accounting/expense-categories";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string; range?: string; category?: string }>;
}) {
  const { focus, range, category } = await searchParams;
  const fromParam = rangeCutoff(range);
  const [placementExpensesRaw, operatingExpensesRaw] = await Promise.all([
    getExpenses(),
    getOperatingExpenses(),
  ]);

  const categoryOptions = usedExpenseCategoryOptions({
    operatingCategories: operatingExpensesRaw.map((e) => e.category),
    placementTypes: placementExpensesRaw.map((e) => e.expenseType),
  });

  const categoryParam =
    category && category !== "all" ? category : undefined;
  const placementDbValues = categoryParam
    ? placementDbValuesForFilter(categoryParam)
    : null;
  const operatingDbValues = categoryParam
    ? operatingDbValuesForFilter(categoryParam)
    : null;
  const categoryIsPlacement = categoryParam
    ? isPlacementCategoryFilter(categoryParam)
    : false;

  const placementFiltered = placementExpensesRaw
    .filter((e) => !fromParam || e.expenseDate >= fromParam)
    .filter((e) => {
      if (!categoryParam) return true;
      if (!categoryIsPlacement || !placementDbValues) return false;
      return placementDbValues.includes(e.expenseType);
    });
  const operatingExpenses = operatingExpensesRaw
    .filter((e) => !fromParam || e.expenseDate >= fromParam)
    .filter((e) => {
      if (!categoryParam) return true;
      if (categoryIsPlacement || !operatingDbValues) return false;
      return operatingDbValues.includes(e.category);
    });

  const payrollOperatingExpenses = operatingExpenses.filter((e) =>
    isPayrollOperatingCategory(e.category),
  );
  const employeeBenefitsExpenses = placementFiltered.filter((e) =>
    isStaffedEmployeeBenefitsType(e.expenseType),
  );
  const placementExpenses = placementFiltered.filter(
    (e) => !isStaffedEmployeeBenefitsType(e.expenseType),
  );
  const otherOperatingExpenses = operatingExpenses.filter(
    (e) => !isPayrollOperatingCategory(e.category),
  );

  const placementTotal = placementExpenses.reduce((s, e) => s + e.amount, 0);
  const payrollOperatingTotal = payrollOperatingExpenses.reduce(
    (s, e) => s + e.amount,
    0,
  );
  const employeeBenefitsTotal = employeeBenefitsExpenses.reduce(
    (s, e) => s + e.amount,
    0,
  );
  const payrollSectionTotal = payrollOperatingTotal + employeeBenefitsTotal;
  const otherOperatingTotal = otherOperatingExpenses.reduce(
    (s, e) => s + e.amount,
    0,
  );
  const filteredTotal =
    payrollSectionTotal + placementTotal + otherOperatingTotal;
  const filtersActive = Boolean(fromParam) || Boolean(categoryParam);

  return (
    <div className="space-y-8">
      <ScrollToFocus focusId={focus} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader title="Expenses" />
        <div className="flex flex-wrap gap-2">
          <Button href="/accounting/expenses/new">Add Expense</Button>
        </div>
      </div>

      <ExpensesToolbar categories={categoryOptions} />

      <div className="space-y-3">
        {filtersActive ? (
          <div className="flex justify-end">
            <p className="text-sm font-semibold text-[var(--cf-ink)]">
              Total Amount{" "}
              <span className="tabular-nums">{money(filteredTotal)}</span>
            </p>
          </div>
        ) : null}

      <CollapsiblePanel
        id="payroll"
        title="Payroll Expenses"
        defaultOpen={
          payrollOperatingExpenses.length > 0 ||
          employeeBenefitsExpenses.length > 0
        }
        action={
          <span className="text-sm font-semibold text-[var(--cf-ink)]">
            {money(payrollSectionTotal)}
          </span>
        }
      >
        <div className="space-y-6">
          <div>
            <p className="mb-2 text-sm font-medium text-[var(--cf-muted)]">
              Staff salaries
            </p>
            <DataTable
              rows={payrollOperatingExpenses}
              rowHtmlId={(row) => `expense-${row.id}`}
              rowClassName={(row) =>
                focus === row.id
                  ? "bg-[var(--cf-accent)]/10 ring-2 ring-inset ring-[var(--cf-accent)]"
                  : undefined
              }
              emptyTitle="No staff salary expenses"
              emptyDescription="Recruiter/accounting salaries and payroll wages appear here and on Payroll."
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

          <div>
            <p className="mb-2 text-sm font-medium text-[var(--cf-muted)]">
              Employee benefits (staffed)
            </p>
            <DataTable
              rows={employeeBenefitsExpenses}
              rowHtmlId={(row) => `expense-${row.id}`}
              rowClassName={(row) =>
                focus === row.id
                  ? "bg-[var(--cf-accent)]/10 ring-2 ring-inset ring-[var(--cf-accent)]"
                  : undefined
              }
              emptyTitle="No employee benefits"
              emptyDescription="Benefits for staffed employees appear here and on Payroll."
              columns={[
                {
                  key: "date",
                  header: "Expense Date",
                  render: (row) => row.expenseDate,
                },
                {
                  key: "category",
                  header: "Category",
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
          </div>
        </div>
      </CollapsiblePanel>
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
              header: "Category",
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
          emptyTitle="No operating expenses"
          emptyDescription="Non-payroll operating expenses appear here."
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
    </div>
  );
}
