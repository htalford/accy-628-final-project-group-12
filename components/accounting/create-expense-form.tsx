"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/accounting/panel";
import { createExpense } from "@/app/actions/create-expense";
import {
  EXPENSE_TYPES,
  OPERATING_EXPENSE_CATEGORIES,
  expenseStatusLabel,
  expenseTypeLabel,
  operatingExpenseCategoryLabel,
} from "@/lib/accounting/format";

type ContractOption = {
  id: string;
  clientName: string;
  employeeName: string;
};

const fieldClass =
  "w-full rounded-md border border-[var(--cf-border)] bg-white px-3 py-2 text-sm text-[var(--cf-ink)] outline-none focus:ring-2 focus:ring-[var(--cf-accent)]";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function CreateExpenseForm({
  contracts,
}: {
  contracts: ContractOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<"placement" | "operating">("placement");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(todayIso());
  const [placementId, setPlacementId] = useState(contracts[0]?.id ?? "");
  const [expenseType, setExpenseType] = useState(EXPENSE_TYPES[0] ?? "other");
  const [status, setStatus] = useState("pending");
  const [category, setCategory] = useState(
    OPERATING_EXPENSE_CATEGORIES[0] ?? "other",
  );

  const monthValue = useMemo(() => {
    if (!expenseDate) return "";
    return expenseDate.slice(0, 7);
  }, [expenseDate]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createExpense({
        kind,
        description,
        amount: Number(amount),
        expenseDate,
        placementId: kind === "placement" ? placementId : null,
        expenseType: kind === "placement" ? expenseType : null,
        status: kind === "placement" ? status : null,
        category: kind === "operating" ? category : null,
        month: kind === "operating" ? `${monthValue}-01` : null,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/accounting/expenses");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Panel title="Expense type">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setKind("placement")}
            className={`rounded-md px-3 py-2 text-sm font-medium transition ${
              kind === "placement"
                ? "bg-[var(--cf-navy)] text-white"
                : "border border-[var(--cf-border)] bg-white text-[var(--cf-ink)] hover:bg-[var(--cf-surface)]"
            }`}
          >
            Placement expense
          </button>
          <button
            type="button"
            onClick={() => setKind("operating")}
            className={`rounded-md px-3 py-2 text-sm font-medium transition ${
              kind === "operating"
                ? "bg-[var(--cf-navy)] text-white"
                : "border border-[var(--cf-border)] bg-white text-[var(--cf-ink)] hover:bg-[var(--cf-surface)]"
            }`}
          >
            Operating expense
          </button>
        </div>
        <p className="mt-2 text-xs text-[var(--cf-muted)]">
          {kind === "placement"
            ? "Direct cost tied to a staffing contract / placement."
            : "Company overhead not tied to a single placement."}
        </p>
      </Panel>

      <Panel title="Details">
        <div className="grid gap-4 sm:grid-cols-2">
          {kind === "placement" ? (
            <>
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block font-medium text-[var(--cf-ink)]">
                  Contract / Placement
                </span>
                <select
                  required
                  value={placementId}
                  onChange={(e) => setPlacementId(e.target.value)}
                  className={fieldClass}
                >
                  <option value="" disabled>
                    Select placement
                  </option>
                  {contracts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.clientName} · {c.employeeName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-[var(--cf-ink)]">
                  Type
                </span>
                <select
                  required
                  value={expenseType}
                  onChange={(e) => setExpenseType(e.target.value as typeof expenseType)}
                  className={fieldClass}
                >
                  {EXPENSE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {expenseTypeLabel(t)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-[var(--cf-ink)]">
                  Status
                </span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={fieldClass}
                >
                  {(["pending", "approved", "rejected", "reimbursed"] as const).map(
                    (s) => (
                      <option key={s} value={s}>
                        {expenseStatusLabel(s)}
                      </option>
                    ),
                  )}
                </select>
              </label>
            </>
          ) : (
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block font-medium text-[var(--cf-ink)]">
                Category
              </span>
              <select
                required
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as typeof category)
                }
                className={fieldClass}
              >
                {OPERATING_EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {operatingExpenseCategoryLabel(c)}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-[var(--cf-ink)]">
              Description
            </span>
            <input
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this expense for?"
              className={fieldClass}
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-[var(--cf-ink)]">
              Amount
            </span>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={fieldClass}
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-[var(--cf-ink)]">
              Expense date
            </span>
            <input
              required
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className={fieldClass}
            />
          </label>

          {kind === "operating" ? (
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block font-medium text-[var(--cf-ink)]">
                Accounting month
              </span>
              <input
                type="month"
                value={monthValue}
                onChange={(e) => {
                  if (e.target.value) {
                    setExpenseDate(`${e.target.value}-01`);
                  }
                }}
                className={`${fieldClass} max-w-xs`}
              />
              <span className="mt-1 block text-xs text-[var(--cf-muted)]">
                Stored as the first day of the month (required by the database).
              </span>
            </label>
          ) : null}
        </div>
      </Panel>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending || (kind === "placement" && !placementId)}>
          {pending ? "Saving…" : "Save expense"}
        </Button>
        <Link
          href="/accounting/expenses"
          className="text-sm font-medium text-[var(--cf-ink)] hover:underline"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
