"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterSelect } from "@/components/ui/filter-select";
import { DataTable, StatusPill } from "@/components/candidate/ui";
import { formatCurrency, formatDate } from "@/lib/candidate/format";

export type CandidatePayRow = {
  id: string;
  weekEnding: string;
  employer: string;
  rate: number;
  hours: number;
  amount: number;
  status: string;
};

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );
}

export function CandidatePayBoard({ rows }: { rows: CandidatePayRow[] }) {
  const [weekEnding, setWeekEnding] = useState("");
  const [employer, setEmployer] = useState("all");
  const [status, setStatus] = useState("all");

  const employers = useMemo(
    () => uniqueSorted(rows.map((r) => r.employer)),
    [rows],
  );
  const statuses = useMemo(
    () => uniqueSorted(rows.map((r) => r.status)),
    [rows],
  );
  const weekOptions = useMemo(
    () =>
      uniqueSorted(rows.map((r) => r.weekEnding)).sort((a, b) =>
        b.localeCompare(a),
      ),
    [rows],
  );

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (weekEnding && row.weekEnding !== weekEnding) return false;
      if (employer !== "all" && row.employer !== employer) return false;
      if (status !== "all" && row.status !== status) return false;
      return true;
    });
  }, [rows, weekEnding, employer, status]);

  const hasFilters =
    weekEnding !== "" || employer !== "all" || status !== "all";

  function clearFilters() {
    setWeekEnding("");
    setEmployer("all");
    setStatus("all");
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No pay activity yet"
        description="After you submit timesheets, estimated pay will appear week by week."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--cf-border)] bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--cf-ink)]">Filters</p>
            <p className="mt-0.5 text-xs text-[var(--cf-muted)]">
              Narrow by week ending, employer, or timesheet status
            </p>
          </div>
          {hasFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[var(--cf-accent)] transition hover:bg-[var(--cf-accent)]/10"
            >
              Clear all
            </button>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex min-w-0 flex-col gap-1.5 text-[11px] font-medium tracking-wide text-[var(--cf-muted)]">
            Week ending
            <div className="flex gap-2">
              <input
                type="date"
                value={weekEnding}
                onChange={(e) => setWeekEnding(e.target.value)}
                aria-label="Week ending calendar"
                className="min-w-0 flex-1 rounded-lg border border-[var(--cf-border)] bg-white px-2.5 py-2 text-sm font-normal text-[var(--cf-ink)] shadow-sm outline-none transition hover:border-[var(--cf-accent)]/50 focus:border-[var(--cf-accent)] focus:ring-2 focus:ring-[var(--cf-accent)]/20"
              />
              <select
                value={weekEnding}
                onChange={(e) => setWeekEnding(e.target.value)}
                aria-label="Week ending list"
                className="min-w-0 flex-1 truncate rounded-lg border border-[var(--cf-border)] bg-white px-2.5 py-2 text-sm font-normal text-[var(--cf-ink)] shadow-sm outline-none transition hover:border-[var(--cf-accent)]/50 focus:border-[var(--cf-accent)] focus:ring-2 focus:ring-[var(--cf-accent)]/20"
              >
                <option value="">All weeks</option>
                {weekOptions.map((w) => (
                  <option key={w} value={w}>
                    {formatDate(w)}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <FilterSelect
            label="Employer"
            value={employer}
            onChange={setEmployer}
            options={[
              { value: "all", label: "All employers" },
              ...employers.map((s) => ({ value: s, label: s })),
            ]}
          />
          <FilterSelect
            label="Status"
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: "All statuses" },
              ...statuses.map((s) => ({
                value: s,
                label: s.replaceAll("_", " "),
              })),
            ]}
          />
        </div>

        <p className="mt-3 text-xs text-[var(--cf-muted)]">
          <span className="font-semibold text-[var(--cf-ink)]">
            {filtered.length}
          </span>{" "}
          of {rows.length} pay row{rows.length === 1 ? "" : "s"}
          {hasFilters ? " matching" : ""}
        </p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No pay rows match your filters"
          description="Try clearing filters or picking a different week ending, employer, or status."
        />
      ) : (
        <DataTable
          headers={[
            "Week ending",
            "Employer",
            "Rate",
            "Hours",
            "Est. pay",
            "Timesheet status",
          ]}
        >
          {filtered.map((row) => (
            <tr key={row.id}>
              <td className="px-4 py-3">{formatDate(row.weekEnding)}</td>
              <td className="px-4 py-3">{row.employer}</td>
              <td className="px-4 py-3">{formatCurrency(row.rate)}</td>
              <td className="px-4 py-3">{row.hours}</td>
              <td className="px-4 py-3 font-medium">
                {formatCurrency(row.amount)}
              </td>
              <td className="px-4 py-3">
                <StatusPill
                  label={row.status}
                  tone={
                    row.status === "approved"
                      ? "good"
                      : row.status === "rejected"
                        ? "bad"
                        : "warn"
                  }
                />
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
