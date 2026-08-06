"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/accounting/panel";
import {
  createJournalEntry,
  updateJournalEntry,
  type JournalLineInput,
} from "@/app/actions/journal-entries";
import { CHART_OF_ACCOUNTS } from "@/lib/accounting/chart-of-accounts";
import {
  JOURNAL_ENTRY_STATUSES,
  journalEntryStatusLabel,
  moneyExact,
} from "@/lib/accounting/format";
import type { JournalEntryStatus } from "@/lib/types/database";

const fieldClass =
  "w-full rounded-md border border-[var(--cf-border)] bg-white px-3 py-2 text-sm text-[var(--cf-ink)] outline-none focus:ring-2 focus:ring-[var(--cf-accent)]";

type LineDraft = {
  key: string;
  accountCode: string;
  description: string;
  debit: string;
  credit: string;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function emptyLine(): LineDraft {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    accountCode: CHART_OF_ACCOUNTS[0]?.code ?? "1000",
    description: "",
    debit: "",
    credit: "",
  };
}

export function JournalEntryForm({
  mode,
  entryId,
  initial,
}: {
  mode: "create" | "edit";
  entryId?: string;
  initial?: {
    entryDate: string;
    memo: string;
    reference: string;
    status: JournalEntryStatus;
    lines: {
      accountCode: string;
      description: string;
      debit: number;
      credit: number;
    }[];
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [entryDate, setEntryDate] = useState(initial?.entryDate ?? todayIso());
  const [memo, setMemo] = useState(initial?.memo ?? "");
  const [reference, setReference] = useState(initial?.reference ?? "");
  const [status, setStatus] = useState<JournalEntryStatus>(
    initial?.status ?? "draft",
  );
  const [lines, setLines] = useState<LineDraft[]>(() => {
    if (initial?.lines?.length) {
      return initial.lines.map((line) => ({
        key: `${line.accountCode}-${Math.random().toString(36).slice(2, 7)}`,
        accountCode: line.accountCode,
        description: line.description,
        debit: line.debit ? String(line.debit) : "",
        credit: line.credit ? String(line.credit) : "",
      }));
    }
    return [emptyLine(), emptyLine()];
  });

  const totals = useMemo(() => {
    let debit = 0;
    let credit = 0;
    for (const line of lines) {
      debit += Number(line.debit) || 0;
      credit += Number(line.credit) || 0;
    }
    return {
      debit: Math.round(debit * 100) / 100,
      credit: Math.round(credit * 100) / 100,
      difference: Math.round((debit - credit) * 100) / 100,
    };
  }, [lines]);

  function updateLine(key: string, patch: Partial<LineDraft>) {
    setLines((prev) =>
      prev.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payloadLines: JournalLineInput[] = lines.map((line) => ({
      accountCode: line.accountCode,
      description: line.description,
      debit: Number(line.debit) || 0,
      credit: Number(line.credit) || 0,
    }));

    startTransition(async () => {
      const input = {
        entryDate,
        memo,
        reference,
        status,
        lines: payloadLines,
      };
      const result =
        mode === "edit" && entryId
          ? await updateJournalEntry(entryId, input)
          : await createJournalEntry(input);

      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/accounting/journal-entries/${result.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <Panel title="Entry details">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--cf-muted)]">Entry date</span>
            <input
              type="date"
              required
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--cf-muted)]">Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as JournalEntryStatus)}
              className={fieldClass}
            >
              {JOURNAL_ENTRY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {journalEntryStatusLabel(s)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-[var(--cf-muted)]">Memo</span>
            <input
              required
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="What is this entry for?"
              className={fieldClass}
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-[var(--cf-muted)]">Reference</span>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Invoice #, check #, or other reference"
              className={fieldClass}
            />
          </label>
        </div>
      </Panel>

      <Panel
        title="Lines"
        action={
          <button
            type="button"
            onClick={() => setLines((prev) => [...prev, emptyLine()])}
            className="inline-flex items-center gap-1 rounded-md border border-[var(--cf-border)] px-2.5 py-1.5 text-xs font-medium text-[var(--cf-ink)] hover:bg-[var(--cf-surface)]"
          >
            <Plus className="h-3.5 w-3.5" />
            Add line
          </button>
        }
      >
        <div className="space-y-3">
          {lines.map((line, index) => (
            <div
              key={line.key}
              className="grid gap-2 rounded-lg border border-[var(--cf-border)] p-3 sm:grid-cols-[1.4fr_1fr_7rem_7rem_auto]"
            >
              <label className="block text-sm">
                <span className="mb-1 block text-[11px] text-[var(--cf-muted)]">
                  Account
                </span>
                <select
                  value={line.accountCode}
                  onChange={(e) =>
                    updateLine(line.key, { accountCode: e.target.value })
                  }
                  className={fieldClass}
                >
                  {CHART_OF_ACCOUNTS.map((account) => (
                    <option key={account.code} value={account.code}>
                      {account.code} · {account.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-[11px] text-[var(--cf-muted)]">
                  Description
                </span>
                <input
                  value={line.description}
                  onChange={(e) =>
                    updateLine(line.key, { description: e.target.value })
                  }
                  className={fieldClass}
                  placeholder={`Line ${index + 1}`}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-[11px] text-[var(--cf-muted)]">
                  Debit
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.debit}
                  onChange={(e) =>
                    updateLine(line.key, {
                      debit: e.target.value,
                      credit: e.target.value ? "" : line.credit,
                    })
                  }
                  className={fieldClass}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-[11px] text-[var(--cf-muted)]">
                  Credit
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.credit}
                  onChange={(e) =>
                    updateLine(line.key, {
                      credit: e.target.value,
                      debit: e.target.value ? "" : line.debit,
                    })
                  }
                  className={fieldClass}
                />
              </label>
              <div className="flex items-end">
                <button
                  type="button"
                  disabled={lines.length <= 2}
                  onClick={() =>
                    setLines((prev) => prev.filter((l) => l.key !== line.key))
                  }
                  className="rounded-md border border-[var(--cf-border)] p-2 text-[var(--cf-muted)] hover:text-red-700 disabled:opacity-40"
                  aria-label="Remove line"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--cf-border)] pt-3 text-sm">
          <div className="space-x-4 text-[var(--cf-muted)]">
            <span>Debits: {moneyExact(totals.debit)}</span>
            <span>Credits: {moneyExact(totals.credit)}</span>
          </div>
          <span
            className={
              totals.difference === 0
                ? "font-medium text-emerald-700"
                : "font-medium text-amber-700"
            }
          >
            {totals.difference === 0
              ? "Balanced"
              : `Out of balance by ${moneyExact(Math.abs(totals.difference))}`}
          </span>
        </div>
      </Panel>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Saving…"
            : mode === "edit"
              ? "Save changes"
              : "Create entry"}
        </Button>
        <Link
          href={
            mode === "edit" && entryId
              ? `/accounting/journal-entries/${entryId}`
              : "/accounting/journal-entries"
          }
          className="inline-flex items-center rounded-md border border-[var(--cf-border)] px-4 py-2 text-sm font-medium text-[var(--cf-ink)] hover:bg-[var(--cf-surface)]"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
