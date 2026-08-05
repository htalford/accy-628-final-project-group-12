import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/candidate/ui";
import { StatusBadge, statusTone } from "@/components/ui/status-badge";
import { getCandidateContractById } from "@/lib/candidate/data";
import { getContractCompletion } from "@/lib/candidate/contract-completion";
import {
  moneyExact,
  placementStatusLabel,
  placementTypeLabel,
  shortId,
} from "@/lib/accounting/format";

export default async function CandidateCompletionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contract = await getCandidateContractById(id);
  if (!contract) notFound();

  const completion = getContractCompletion(
    {
      start_date: contract.startDate,
      end_date: contract.endDate,
      status: contract.status,
      pay_rate: contract.payRate,
    },
    contract.timesheets.map((t) => ({
      status: t.status as
        | "submitted"
        | "approved"
        | "disputed"
        | "rejected",
      hours_regular: t.hoursRegular,
      hours_overtime: t.hoursOvertime,
    })),
  );

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/candidate/completions"
          className="text-sm text-[var(--cf-accent)] hover:underline"
        >
          ← Back to completion status
        </Link>
        <PageHeader
          title={`Contract ${shortId(contract.id)}`}
          description={`${contract.client?.name ?? "Employer"} · ${placementTypeLabel(contract.billingType)}`}
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusBadge
            label={placementStatusLabel(contract.status)}
            tone={statusTone(contract.status)}
          />
          <span className="text-sm text-[var(--cf-muted)]">
            {contract.startDate}
            {contract.endDate ? ` → ${contract.endDate}` : " · Open end"}
          </span>
        </div>
      </div>

      <section className="rounded-2xl border border-[var(--cf-border)] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--cf-ink)]">
            {completion.percent}% complete
          </h2>
          <p className="text-sm text-[var(--cf-muted)]">
            {completion.doneCount} / {completion.totalCount} milestones
          </p>
        </div>
        <div
          className="mt-4 h-3 overflow-hidden rounded-full bg-[var(--cf-border)]"
          role="progressbar"
          aria-valuenow={completion.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Contract completion"
        >
          <div
            className="h-full rounded-full bg-[var(--cf-accent)] transition-[width]"
            style={{ width: `${completion.percent}%` }}
          />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="What has been done">
          <ul className="space-y-3">
            {completion.items.map((item) => (
              <li
                key={item.id}
                className="flex gap-3 rounded-lg border border-[var(--cf-border)]/70 px-3 py-2.5"
              >
                <span
                  className={`mt-0.5 shrink-0 text-sm font-bold ${
                    item.complete ? "text-emerald-600" : "text-red-600"
                  }`}
                  aria-hidden
                >
                  {item.complete ? "✓" : "✕"}
                </span>
                <div className="min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      item.complete
                        ? "text-[var(--cf-ink)]"
                        : "text-[var(--cf-muted)]"
                    }`}
                  >
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--cf-muted)]">
                    {item.detail}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Contract snapshot">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--cf-muted)]">Your pay rate</dt>
              <dd>
                {contract.payRate != null
                  ? `${moneyExact(contract.payRate)} / hr`
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--cf-muted)]">Timesheets</dt>
              <dd>{contract.timesheets.length}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--cf-muted)]">Still open</dt>
              <dd>
                {completion.missing.length === 0
                  ? "All milestones done"
                  : `${completion.missing.length} remaining`}
              </dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
            <Link
              href={`/candidate/contracts/${contract.id}`}
              className="text-[var(--cf-accent)] hover:underline"
            >
              View full contract →
            </Link>
            <Link
              href="/candidate/timesheets"
              className="text-[var(--cf-accent)] hover:underline"
            >
              Timesheets →
            </Link>
          </div>
        </Panel>
      </div>
    </div>
  );
}
