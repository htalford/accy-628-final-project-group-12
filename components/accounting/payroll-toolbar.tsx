"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { DATE_RANGE_OPTIONS } from "@/lib/accounting/date-range-filter";

export function PayrollToolbar({
  employees,
  periods,
}: {
  employees: string[];
  periods: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") params.delete(key);
    else params.set(key, value);
    if (key === "range") params.delete("from");
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  const from = searchParams.get("from");

  return (
    <div className={`flex flex-wrap gap-3 ${pending ? "opacity-70" : ""}`}>
      {from ? (
        <button
          type="button"
          className="rounded-md border border-[var(--cf-border)] bg-[var(--cf-surface)] px-3 py-2 text-sm text-[var(--cf-ink)] hover:bg-white"
          onClick={() => update("from", "all")}
        >
          From {from} ×
        </button>
      ) : null}
      <select
        className="rounded-md border border-[var(--cf-border)] bg-white px-3 py-2 text-sm text-[var(--cf-ink)]"
        defaultValue={searchParams.get("range") ?? "all"}
        onChange={(e) => update("range", e.target.value)}
      >
        {DATE_RANGE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <select
        className="rounded-md border border-[var(--cf-border)] bg-white px-3 py-2 text-sm text-[var(--cf-ink)]"
        defaultValue={searchParams.get("period") ?? "all"}
        onChange={(e) => update("period", e.target.value)}
      >
        <option value="all">All pay periods</option>
        {periods.map((p) => (
          <option key={p} value={p}>
            Week ending {p}
          </option>
        ))}
      </select>
      <select
        className="rounded-md border border-[var(--cf-border)] bg-white px-3 py-2 text-sm text-[var(--cf-ink)]"
        defaultValue={searchParams.get("employee") ?? "all"}
        onChange={(e) => update("employee", e.target.value)}
      >
        <option value="all">All employees</option>
        {employees.map((e) => (
          <option key={e} value={e}>
            {e}
          </option>
        ))}
      </select>
      <select
        className="rounded-md border border-[var(--cf-border)] bg-white px-3 py-2 text-sm text-[var(--cf-ink)]"
        defaultValue={searchParams.get("status") ?? "all"}
        onChange={(e) => update("status", e.target.value)}
      >
        <option value="all">All statuses</option>
        <option value="submitted">Submitted</option>
        <option value="approved">Approved</option>
        <option value="disputed">Disputed</option>
        <option value="rejected">Rejected</option>
      </select>
    </div>
  );
}
