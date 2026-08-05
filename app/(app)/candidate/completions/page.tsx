import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge, statusTone } from "@/components/ui/status-badge";
import {
  getCandidatePlacements,
  getCandidateTimesheets,
} from "@/lib/candidate/data";
import { getContractCompletion } from "@/lib/candidate/contract-completion";
import {
  placementStatusLabel,
  placementTypeLabel,
  shortId,
} from "@/lib/accounting/format";

export default async function CandidateCompletionsPage() {
  const [placements, timesheets] = await Promise.all([
    getCandidatePlacements(),
    getCandidateTimesheets(),
  ]);

  const timesheetsByPlacement = new Map<string, typeof timesheets>();
  for (const ts of timesheets) {
    const list = timesheetsByPlacement.get(ts.placement_id) ?? [];
    list.push(ts);
    timesheetsByPlacement.set(ts.placement_id, list);
  }

  const rows = placements.map((p) => {
    const completion = getContractCompletion(
      p,
      timesheetsByPlacement.get(p.id) ?? [],
    );
    return {
      id: p.id,
      employer: p.clients?.name ?? "Employer",
      type: p.placement_type,
      status: p.status,
      startDate: p.start_date,
      endDate: p.end_date,
      completion,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Completion status"
        description="Track how far each contract is through its lifecycle — from start through timesheets, pay, and closeout."
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No contracts yet"
          description="When Accounting books a placement for you, its completion progress will appear here."
        />
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={`/candidate/completions/${row.id}`}
                className="block rounded-xl border border-[var(--cf-border)] bg-white p-4 shadow-sm transition hover:border-[var(--cf-accent)]/40 hover:bg-[var(--cf-surface)]/50 sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-[var(--cf-muted)]">
                      Contract {shortId(row.id)}
                    </p>
                    <h2 className="mt-0.5 truncate text-base font-semibold text-[var(--cf-ink)]">
                      {row.employer}
                    </h2>
                    <p className="mt-1 text-sm text-[var(--cf-muted)]">
                      {placementTypeLabel(row.type)} · {row.startDate}
                      {row.endDate ? ` → ${row.endDate}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <StatusBadge
                      label={placementStatusLabel(row.status)}
                      tone={statusTone(row.status)}
                    />
                    <span className="text-lg font-semibold tabular-nums text-[var(--cf-navy)]">
                      {row.completion.percent}%
                    </span>
                  </div>
                </div>

                <div
                  className="mt-4 h-2.5 overflow-hidden rounded-full bg-[var(--cf-border)]"
                  role="progressbar"
                  aria-valuenow={row.completion.percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${row.employer} contract ${row.completion.percent}% complete`}
                >
                  <div
                    className="h-full rounded-full bg-[var(--cf-accent)] transition-[width]"
                    style={{ width: `${row.completion.percent}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-[var(--cf-muted)]">
                  {row.completion.doneCount} of {row.completion.totalCount}{" "}
                  milestones complete · View details →
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
